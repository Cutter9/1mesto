import { clamp, isLikelyLowPerformanceDevice, mapRange } from "./utils.js";

const SCENE_URL = "https://prod.spline.design/5c4BvsNCkwBZLz43/scene.splinecode";
const CAMERA_NAME = "Personal Camera";

const ZOOM_MIN = 1;
const ZOOM_MAX = 1;
const WIDTH_MIN = 420;
const WIDTH_MAX = 560;

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

  const container = canvas.parentElement;
  if (!container) return;

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

    const updateZoom = () => {
      const width = container.clientWidth;
      const safeWidth = clamp(width, WIDTH_MIN, WIDTH_MAX);
      const nextZoom = mapRange(safeWidth, WIDTH_MIN, WIDTH_MAX, ZOOM_MIN, ZOOM_MAX);
      camera.zoom = Number(nextZoom.toFixed(3));
    };

    const observer = new ResizeObserver(updateZoom);
    observer.observe(container);
    updateZoom();

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
