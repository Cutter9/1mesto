import { initCustomCursor } from "./js/cursor.js";
import { initHeroSpline } from "./js/spline.js";
import { initRevealCards } from "./js/reveal-cards.js";
import { initSmoothScroll } from "./js/smooth-scroll.js";
import { initHeaderScrollState } from "./js/header-scroll.js";

function scheduleHeroSplineInit() {
  const heroSection = document.querySelector(".hero");
  if (!heroSection) {
    initHeroSpline();
    return;
  }

  let started = false;
  let startTimerId = null;

  const runOnce = () => {
    if (started) return;
    started = true;
    if (startTimerId !== null) {
      clearTimeout(startTimerId);
      startTimerId = null;
    }
    initHeroSpline();
  };

  const scheduleAtIdle = () => {
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(runOnce, { timeout: 1800 });
      return;
    }

    startTimerId = window.setTimeout(runOnce, 350);
  };

  const observer = new IntersectionObserver(
    (entries) => {
      const isVisible = entries.some((entry) => entry.isIntersecting);
      if (!isVisible) return;
      observer.disconnect();
      if (startTimerId !== null) {
        clearTimeout(startTimerId);
        startTimerId = null;
      }
      scheduleAtIdle();
    },
    { rootMargin: "220px 0px" }
  );

  observer.observe(heroSection);

  startTimerId = window.setTimeout(() => {
    observer.disconnect();
    scheduleAtIdle();
  }, 4200);
}

scheduleHeroSplineInit();
initCustomCursor();
initRevealCards();
initSmoothScroll();
initHeaderScrollState();
