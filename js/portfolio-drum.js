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
    const states = ["Было", "Стало"];

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
  if (!scrollRoot || !pin || !drum || cards.length < 2) return;

  const runtime = getGsapRuntime();
  if (!runtime?.ScrollTrigger || prefersReducedMotion) return;

  let trigger = null;

  const resetCards = () => {
    cards.forEach((card) => {
      card.classList.remove("is-center");
      card.style.removeProperty("transform");
      card.style.removeProperty("opacity");
      card.style.removeProperty("z-index");
      card.style.removeProperty("filter");
      card.style.removeProperty("pointer-events");
    });
  };

  const destroy = () => {
    if (trigger) {
      trigger.kill();
      trigger = null;
    }

    drum.classList.remove("portfolio__drum--animated");
    pin.style.removeProperty("perspective");
    scrollRoot.style.removeProperty("height");
    resetCards();
  };

  const setup = () => {
    destroy();

    if (window.innerWidth <= 1200) return;

    drum.classList.add("portfolio__drum--animated");
    pin.style.perspective = "2200px";

    const cardStep = pin.offsetHeight * 0.58;
    const totalDistance = Math.max(window.innerHeight * 1.8, cardStep * (cards.length - 1) + window.innerHeight * 0.6);
    scrollRoot.style.height = `${Math.ceil(totalDistance + pin.offsetHeight)}px`;

    const render = (progress) => {
      const position = progress * (cards.length - 1);

      cards.forEach((card, index) => {
        const relative = index - position;
        const abs = Math.abs(relative);

        const y = relative * cardStep;
        const scale = relative >= 0 ? 1 + Math.min(relative * 0.05, 0.12) : 1 - Math.min(abs * 0.14, 0.38);
        const rotateX = relative >= 0 ? -Math.min(relative * 12, 24) : Math.min(abs * 13, 24);
        const z = relative >= 0 ? Math.min(relative * 120, 220) : -Math.min(abs * 160, 280);
        const opacity = Math.max(0, 1 - abs * 0.46);
        const blur = Math.min(abs * 1.8, 4.5);
        const isCenter = abs < 0.52;

        card.classList.toggle("is-center", isCenter);
        card.style.opacity = opacity.toFixed(3);
        card.style.filter = `blur(${blur.toFixed(2)}px)`;
        card.style.zIndex = String(1000 - Math.round(abs * 120));
        card.style.pointerEvents = isCenter ? "auto" : "none";
        card.style.transform =
          `translate3d(0, ${y.toFixed(2)}px, ${z.toFixed(2)}px) ` +
          `rotateX(${rotateX.toFixed(2)}deg) scale(${scale.toFixed(3)})`;
      });
    };

    trigger = runtime.ScrollTrigger.create({
      trigger: scrollRoot,
      start: "top top+=80",
      end: `+=${totalDistance}`,
      scrub: 0.85,
      pin,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        render(self.progress);
      }
    });

    render(0);
  };

  setup();
  window.addEventListener("resize", setup);
}
