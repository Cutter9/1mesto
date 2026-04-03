import { isLikelyLowPerformanceDevice } from "./utils.js";

const SCENE_URL = "https://prod.spline.design/5c4BvsNCkwBZLz43/scene.splinecode";
const CAMERA_NAME = "Personal Camera";

const SOFTWARE_RENDERER_PATTERNS = [
  /swiftshader/i,
  /software/i,
  /llvmpipe/i,
  /microsoft basic render driver/i
];

function applySplineFallback(canvas) {
  const splineWrap = canvas.closest(".hero__spline-wrap");
  const heroVisual = canvas.closest(".hero__visual");

  splineWrap?.classList.add("hero__spline-wrap--disabled");
  heroVisual?.classList.add("hero__visual--fallback");
  canvas.setAttribute("aria-hidden", "true");
}

function hasSoftwareRenderer() {
  const probeCanvas = document.createElement("canvas");
  const gl = probeCanvas.getContext("webgl") || probeCanvas.getContext("experimental-webgl");

  if (!gl) return true;

  const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
  const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : "";

  return SOFTWARE_RENDERER_PATTERNS.some((pattern) => pattern.test(renderer));
}

export async function initHeroSpline() {
  const canvas = document.getElementById("hero-spline-canvas");
  if (!canvas) return;

  if (isLikelyLowPerformanceDevice() || hasSoftwareRenderer()) {
    applySplineFallback(canvas);
    return;
  }

  try {
    const { Application } = await import("https://unpkg.com/@splinetool/runtime/build/runtime.js");

    const app = new Application(canvas);
    await app.load(SCENE_URL);

    const camera = app.findObjectByName(CAMERA_NAME);
    if (!camera) {
      console.warn(`[Spline] Camera "${CAMERA_NAME}" was not found in the scene.`);
      return;
    }
    camera.zoom = 1;

    const visibilityHandler = () => {
      if (document.hidden) {
        app.stop?.();
        return;
      }

      app.play?.();
    };

    document.addEventListener("visibilitychange", visibilityHandler, { passive: true });
    visibilityHandler();
  } catch (error) {
    applySplineFallback(canvas);
    console.error("[Spline] Failed to initialize runtime scene:", error);
  }
}
