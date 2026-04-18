import { isLikelyLowPerformanceDevice } from "./utils.js";

export function initCustomCursor() {
  const cursor = document.querySelector(".custom-cursor");
  const dot = document.querySelector(".custom-cursor-dot");
  if (!cursor || !dot) return;

  const supportsFinePointer =
    window.matchMedia("(hover: hover)").matches &&
    window.matchMedia("(pointer: fine)").matches;

  if (!supportsFinePointer) {
    cursor.style.display = "none";
    dot.style.display = "none";
    return;
  }

  const lowPerformanceMode = isLikelyLowPerformanceDevice();
  if (lowPerformanceMode) {
    cursor.classList.add("custom-cursor--lite");
  }

  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let cursorX = targetX;
  let cursorY = targetY;
  let rafId = null;
  let lastMoveTs = 0;
  let isInsideWindow = true;
  const lagFactor = lowPerformanceMode ? 0.24 : 0.16;

  const stopAnimation = () => {
    if (rafId === null) return;
    cancelAnimationFrame(rafId);
    rafId = null;
  };

  const animateCursor = () => {
    cursorX += (targetX - cursorX) * lagFactor;
    cursorY += (targetY - cursorY) * lagFactor;
    cursor.style.transform = `translate3d(calc(${cursorX}px - 50%), calc(${cursorY}px - 50%), 0)`;

    const isSettled = Math.abs(targetX - cursorX) < 0.2 && Math.abs(targetY - cursorY) < 0.2;
    const isIdle = performance.now() - lastMoveTs > 140;

    if (!isInsideWindow || (isSettled && isIdle)) {
      rafId = null;
      return;
    }

    rafId = requestAnimationFrame(animateCursor);
  };

  const ensureAnimation = () => {
    if (rafId !== null) return;
    rafId = requestAnimationFrame(animateCursor);
  };

  const updatePosition = (event) => {
    const x = event.clientX;
    const y = event.clientY;
    targetX = x;
    targetY = y;
    dot.style.transform = `translate3d(calc(${x}px - 50%), calc(${y}px - 50%), 0)`;
    cursor.style.opacity = "1";
    dot.style.opacity = "1";
    lastMoveTs = performance.now();
    ensureAnimation();
  };

  document.addEventListener("mousemove", updatePosition, { passive: true });
  document.addEventListener("mouseleave", () => {
    isInsideWindow = false;
    cursor.style.opacity = "0";
    dot.style.opacity = "0";
    stopAnimation();
  });
  document.addEventListener("mouseenter", () => {
    isInsideWindow = true;
    cursor.style.opacity = "1";
    dot.style.opacity = "1";
    lastMoveTs = performance.now();
    ensureAnimation();
  });
}
