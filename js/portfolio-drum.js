import { prefersReducedMotion } from "./utils.js";
import { getGsapRuntime } from "./gsap-runtime.js";

function initBeforeAfterSwitchers() {
  const wrappers = document.querySelectorAll("[data-before-after]");

  wrappers.forEach((wrapper) => {
    const slides = Array.from(wrapper.querySelectorAll("[data-before-after-slide]"));
    const label = wrapper.querySelector("[data-before-after-label]");
    const prevButton = wrapper.querySelector("[data-before-after-prev]");
    const nextButton = wrapper.querySelector("[data-before-after-next]");

    if (slides.length < 2 || !label || !prevButton || !nextButton) return;

    let index = 0;
    const states = ["\u0411\u044b\u043b\u043e", "\u0421\u0442\u0430\u043b\u043e"];

    const render = () => {
      slides.forEach((slide, slideIndex) => {
        slide.classList.toggle("is-active", slideIndex === index);
      });
      label.textContent = states[index] || states[0];
      wrapper.dataset.state = index === 0 ? "before" : "after";
    };

    prevButton.addEventListener("click", () => {
      index = index === 0 ? slides.length - 1 : index - 1;
      render();
    });

    nextButton.addEventListener("click", () => {
      index = (index + 1) % slides.length;
      render();
    });

    render();
  });
}

export function initPortfolioDrum() {
  initBeforeAfterSwitchers();

  const scrollRoot = document.querySelector("[data-portfolio-drum]");
  const pin = scrollRoot?.querySelector(".portfolio__drum-pin");
  const drum = scrollRoot?.querySelector("[data-portfolio-track]");
  const cards = Array.from(scrollRoot?.querySelectorAll("[data-portfolio-card]") || []);
  const cta = scrollRoot?.closest(".portfolio")?.querySelector(".portfolio__cta");
  const animatedItems = cta ? [...cards, cta] : cards;
  if (!scrollRoot || !drum || animatedItems.length < 1) return;

  const runtime = getGsapRuntime();
  if (!runtime?.ScrollTrigger || prefersReducedMotion) return;

  const gsap = runtime.gsap;
  let sectionTrigger = null;
  let resizeRaf = null;

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const lerp = (from, to, progress) => from + (to - from) * progress;

  const resetAnimatedItems = () => {
    animatedItems.forEach((item) => {
      item.classList.remove("is-center");
      item.style.removeProperty("transform");
      item.style.removeProperty("opacity");
      item.style.removeProperty("z-index");
      item.style.removeProperty("filter");
      item.style.removeProperty("pointer-events");
    });
  };

  const destroy = () => {
    if (sectionTrigger) {
      sectionTrigger.kill();
      sectionTrigger = null;
    }

    drum.classList.remove("portfolio__drum--animated");
    scrollRoot.classList.remove("portfolio__drum-scroll--animated");
    if (pin) {
      pin.style.removeProperty("perspective");
      pin.style.removeProperty("perspective-origin");
    }
    resetAnimatedItems();
  };

  const getRevealProgress = (rect, viewportHeight) => {
    const startTop = viewportHeight;
    const endTop = viewportHeight * 0.5 - rect.height * 0.5;
    const range = Math.max(1, startTop - endTop);
    return clamp((startTop - rect.top) / range, 0, 1);
  };

  const renderAnimatedItems = () => {
    const viewportHeight = Math.max(window.innerHeight || 0, 1);

    animatedItems.forEach((item, index) => {
      const rect = item.getBoundingClientRect();
      const rawProgress = getRevealProgress(rect, viewportHeight);
      const progress = rawProgress <= 0.01 ? 0 : rawProgress >= 0.99 ? 1 : rawProgress;

      // Same geometry, but with half intensity and 60% initial scale.
      const scale = lerp(0.8, 1, progress);
      const rotateX = lerp(-32, 0, progress);
      const z = lerp(-60, 0, progress);
      const translateY = lerp(46, 0, progress);
      const opacity = lerp(0.5, 1, progress);
      const blur = lerp(4.2, 0, progress);

      item.classList.toggle("is-center", progress >= 0.995);
      item.style.zIndex = String(1000 + Math.round(progress * 100) + index);
      item.style.pointerEvents = "auto";
      item.style.opacity = opacity.toFixed(3);
      item.style.filter = `blur(${blur.toFixed(2)}px)`;
      item.style.transform =
        `perspective(1520px) translate3d(0, ${translateY.toFixed(2)}px, ${z.toFixed(2)}px) ` +
        `rotateX(${rotateX.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
    });
  };

  const setup = () => {
    destroy();

    if (window.innerWidth < 992) return;

    scrollRoot.classList.add("portfolio__drum-scroll--animated");

    animatedItems.forEach((item) => {
      gsap.set(item, {
        transformOrigin: "50% 50%",
        transformStyle: "preserve-3d",
        force3D: true,
        pointerEvents: "auto"
      });
    });

    sectionTrigger = runtime.ScrollTrigger.create({
      trigger: scrollRoot.closest(".portfolio") || scrollRoot,
      start: "top bottom",
      end: "bottom top",
      invalidateOnRefresh: true,
      onEnter: renderAnimatedItems,
      onEnterBack: renderAnimatedItems,
      onLeave: renderAnimatedItems,
      onLeaveBack: renderAnimatedItems,
      onUpdate: renderAnimatedItems,
      onRefresh: renderAnimatedItems
    });

    renderAnimatedItems();
    runtime.ScrollTrigger.refresh();
  };

  setup();
  window.addEventListener("resize", () => {
    if (resizeRaf !== null) {
      window.cancelAnimationFrame(resizeRaf);
    }
    resizeRaf = window.requestAnimationFrame(() => {
      resizeRaf = null;
      setup();
    });
  });
}
