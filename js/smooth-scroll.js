import { clamp, isLikelyLowPerformanceDevice } from "./utils.js";

export function initSmoothScroll() {
  const supportsFinePointer =
    window.matchMedia("(hover: hover)").matches &&
    window.matchMedia("(pointer: fine)").matches;

  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!supportsFinePointer || prefersReducedMotion || isLikelyLowPerformanceDevice()) return;

  document.documentElement.style.scrollBehavior = "auto";

  let currentY = window.scrollY;
  let targetY = currentY;
  let rafId = null;

  const SCROLL_SPEED = 0.8;
  const INERTIA_EASING = 0.016;

  const animate = () => {
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

    targetY = clamp(targetY, 0, maxScroll);
    currentY += (targetY - currentY) * INERTIA_EASING;

    if (Math.abs(targetY - currentY) < 0.25) {
      currentY = targetY;
      window.scrollTo(0, currentY);
      rafId = null;
      return;
    }

    window.scrollTo(0, currentY);
    rafId = requestAnimationFrame(animate);
  };

  const requestTick = () => {
    if (rafId !== null) return;
    rafId = requestAnimationFrame(animate);
  };

  const handleWheel = (event) => {
    if (!event.cancelable) return;

    event.preventDefault();

    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    targetY = clamp(targetY + event.deltaY * SCROLL_SPEED, 0, maxScroll);
    requestTick();
  };

  window.addEventListener("wheel", handleWheel, { passive: false });

  window.addEventListener("resize", () => {
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    targetY = clamp(targetY, 0, maxScroll);
    currentY = clamp(window.scrollY, 0, maxScroll);
  });

  window.addEventListener(
    "scroll",
    () => {
      if (rafId !== null) return;
      currentY = window.scrollY;
      targetY = currentY;
    },
    { passive: true }
  );
}
