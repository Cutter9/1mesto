import { initCustomCursor } from "./js/cursor.js";
import { initHeroSpline } from "./js/spline.js";
import { initRevealCards } from "./js/reveal-cards.js";
import { initSmoothScroll } from "./js/smooth-scroll.js";
import { initHeaderScrollState } from "./js/header-scroll.js";
import { initPrinciplesCarousel } from "./js/principles-carousel.js";
import { initBrandBlockReveal } from "./js/brand-block-reveal.js";
import { initBrandBlockAutoscale } from "./js/brand-block-autoscale.js";
import { initAdditionalSlider } from "./js/additional-slider.js";
import { initPortfolioDrum } from "./js/portfolio-drum.js";
import { initWorkStagesAnimation } from "./js/work-stages.js";
import { initDisclosureLists } from "./js/disclosure.js";
import { initOverlayUi } from "./js/overlay-ui.js";

function initScrollTriggerAutoRefresh() {
  if (!window.ScrollTrigger) return;

  let refreshRaf = null;
  const requestRefresh = () => {
    if (refreshRaf !== null) return;
    refreshRaf = window.requestAnimationFrame(() => {
      refreshRaf = null;
      window.ScrollTrigger.refresh();
    });
  };

  const lazyImages = Array.from(document.querySelectorAll('img[loading="lazy"]'));
  lazyImages.forEach((image) => {
    if (image.complete) return;
    image.addEventListener("load", requestRefresh, { once: true });
    image.addEventListener("error", requestRefresh, { once: true });
  });

  if (document.fonts?.ready) {
    document.fonts.ready.then(requestRefresh).catch(() => {});
  }
}

function scheduleAtIdle(task, timeout = 1500, fallbackDelay = 320) {
  let started = false;

  const runOnce = () => {
    if (started) return;
    started = true;
    task();
  };

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(runOnce, { timeout });
    return;
  }

  window.setTimeout(runOnce, fallbackDelay);
}

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
initBrandBlockAutoscale();
initHeaderScrollState();
initRevealCards();
initAdditionalSlider();
initPortfolioDrum();
initWorkStagesAnimation();
initDisclosureLists();
initOverlayUi();
initScrollTriggerAutoRefresh();

if (window.ScrollTrigger) {
  window.addEventListener(
    "load",
    () => {
      window.ScrollTrigger.refresh();
    },
    { once: true }
  );
}

scheduleAtIdle(() => {
  initSmoothScroll();
  initCustomCursor();
  initPrinciplesCarousel();
  initBrandBlockReveal();
});
