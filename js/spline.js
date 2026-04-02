import { clamp, mapRange } from "./utils.js";

const SCENE_URL = "https://prod.spline.design/5c4BvsNCkwBZLz43/scene.splinecode";
const CAMERA_NAME = "Personal Camera";

const ZOOM_MIN = 1;
const ZOOM_MAX = 1;
const WIDTH_MIN = 420;
const WIDTH_MAX = 560;

export async function initHeroSpline() {
  const canvas = document.getElementById("hero-spline-canvas");
  if (!canvas) return;

  const container = canvas.parentElement;
  if (!container) return;

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
  } catch (error) {
    console.error("[Spline] Failed to initialize runtime scene:", error);
  }
}
