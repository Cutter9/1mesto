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

function initWhenNearViewport(selector, init, options = {}) {
  const target = document.querySelector(selector);
  if (!target) return;

  const { rootMargin = "240px 0px", threshold = 0, timeoutMs = 12000 } = options;
  let started = false;
  let observer = null;
  let timeoutId = null;

  const runOnce = () => {
    if (started) return;
    started = true;
    if (observer) observer.disconnect();
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    init();
  };

  if (!("IntersectionObserver" in window)) {
    scheduleAtIdle(runOnce, 1800, 280);
    return;
  }

  observer = new IntersectionObserver(
    (entries) => {
      const isVisible = entries.some((entry) => entry.isIntersecting);
      if (isVisible) runOnce();
    },
    { rootMargin, threshold }
  );

  observer.observe(target);
  timeoutId = window.setTimeout(runOnce, timeoutMs);
}

let gsapLoadPromise = null;
let scrollTriggerHooksInitialized = false;

function loadExternalScript(src) {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === "true") {
        resolve();
        return;
      }

      existing.addEventListener("load", () => resolve(), { once: true });
      existing.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.defer = true;
    script.addEventListener(
      "load",
      () => {
        script.dataset.loaded = "true";
        resolve();
      },
      { once: true }
    );
    script.addEventListener("error", () => reject(new Error(`Failed to load ${src}`)), { once: true });
    document.head.appendChild(script);
  });
}

function ensureGsapLoaded() {
  if (window.gsap && window.ScrollTrigger) {
    return Promise.resolve();
  }

  if (gsapLoadPromise) return gsapLoadPromise;

  gsapLoadPromise = loadExternalScript("https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js")
    .then(() => loadExternalScript("https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/ScrollTrigger.min.js"))
    .then(() => {
      if (window.gsap && window.ScrollTrigger) {
        try {
          window.gsap.registerPlugin(window.ScrollTrigger);
        } catch (_error) {
          // Plugin may already be registered.
        }
      }
    })
    .catch((error) => {
      console.error("[GSAP] Failed to load runtime:", error);
      throw error;
    });

  return gsapLoadPromise;
}

function initScrollTriggerHooksOnce() {
  if (scrollTriggerHooksInitialized) return;
  scrollTriggerHooksInitialized = true;

  initScrollTriggerAutoRefresh();

  window.addEventListener(
    "load",
    () => {
      if (window.ScrollTrigger) {
        window.ScrollTrigger.refresh();
      }
    },
    { once: true }
  );
}

function runWithGsap(init) {
  return () => {
    ensureGsapLoaded()
      .then(() => {
        initScrollTriggerHooksOnce();
        init();
        if (window.ScrollTrigger) {
          window.ScrollTrigger.refresh();
        }
      })
      .catch(() => {
        init();
      });
  };
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
initDisclosureLists();
initOverlayUi();

initWhenNearViewport(".portfolio", () => {
  if (window.matchMedia("(min-width: 992px)").matches) {
    runWithGsap(initPortfolioDrum)();
    return;
  }

  initPortfolioDrum();
});

initWhenNearViewport(".principles", runWithGsap(initPrinciplesCarousel), {
  rootMargin: "320px 0px",
  timeoutMs: 10000
});

initWhenNearViewport(".brand-block", runWithGsap(initBrandBlockReveal), {
  rootMargin: "260px 0px",
  timeoutMs: 12000
});

initWhenNearViewport("[data-work-stages]", runWithGsap(initWorkStagesAnimation), {
  rootMargin: "360px 0px",
  timeoutMs: 12000
});

scheduleAtIdle(() => {
  initSmoothScroll();
  initCustomCursor();
});
