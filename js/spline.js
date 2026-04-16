import { prefersReducedMotion } from "./utils.js";

const SCENE_URL = "https://prod.spline.design/5c4BvsNCkwBZLz43/scene.splinecode";
const CAMERA_NAME = "Personal Camera";

function applySplineFallback(canvas) {
  const splineWrap = canvas.closest(".hero__spline-wrap");
  const heroVisual = canvas.closest(".hero__visual");

  splineWrap?.classList.add("hero__spline-wrap--disabled");
  heroVisual?.classList.add("hero__visual--fallback");
  canvas.setAttribute("aria-hidden", "true");
}

export async function initHeroSpline() {
  const canvas = document.getElementById("hero-spline-canvas");
  if (!canvas) return;

  if (prefersReducedMotion) {
    applySplineFallback(canvas);
    return;
  }

  try {
    let runtimeModule = null;
    try {
      runtimeModule = await import("https://cdn.jsdelivr.net/npm/@splinetool/runtime/build/runtime.js");
    } catch (_firstError) {
      runtimeModule = await import("https://unpkg.com/@splinetool/runtime/build/runtime.js");
    }

    const { Application } = runtimeModule;

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
    // Fallback only when runtime/scene load actually failed.
    applySplineFallback(canvas);
    console.error("[Spline] Failed to initialize runtime scene:", error);
  }
}
