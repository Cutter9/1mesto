import { clamp, isLikelyLowPerformanceDevice, prefersReducedMotion } from "./utils.js";

export function initSmoothScroll() {
  if (window.__smoothScrollInitialized) return;

  const supportsFinePointer =
    window.matchMedia("(hover: hover)").matches &&
    window.matchMedia("(pointer: fine)").matches;

  if (!supportsFinePointer || prefersReducedMotion || isLikelyLowPerformanceDevice()) return;
  window.__smoothScrollInitialized = true;

  document.documentElement.style.scrollBehavior = "auto";

  let currentY = window.scrollY;
  let targetY = currentY;
  let rafId = null;

  const SCROLL_SPEED = 0.8;
  const INERTIA_EASING = 0.016;
  const END_PHASE_DISTANCE = 170;
  const END_PHASE_EASING = 0.06;
  const SNAP_THRESHOLD = 0.75;

  const animate = () => {
    const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);

    targetY = clamp(targetY, 0, maxScroll);
    const delta = targetY - currentY;
    const distance = Math.abs(delta);
    const endPhase = clamp(1 - distance / END_PHASE_DISTANCE, 0, 1);
    const blend = endPhase * endPhase;
    const easing = INERTIA_EASING + (END_PHASE_EASING - INERTIA_EASING) * blend;
    currentY += delta * easing;

    if (Math.abs(targetY - currentY) < SNAP_THRESHOLD) {
      currentY = targetY;
      window.scrollTo(0, currentY);
      if (window.ScrollTrigger) window.ScrollTrigger.update();
      rafId = null;
      return;
    }

    window.scrollTo(0, currentY);
    if (window.ScrollTrigger) window.ScrollTrigger.update();
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
