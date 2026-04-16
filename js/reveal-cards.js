import { clamp } from "./utils.js";
import { getGsapRuntime } from "./gsap-runtime.js";

export function initRevealCards() {
  const cards = document.querySelectorAll("[data-reveal-card]");
  if (!cards.length) return;

  const runtime = getGsapRuntime();
  if (runtime?.ScrollTrigger) {
    cards.forEach((card) => {
      card.style.setProperty("--reveal", "0");

      runtime.ScrollTrigger.create({
        trigger: card,
        start: "top 92%",
        end: "top 50%",
        scrub: true,
        onUpdate: (self) => {
          card.style.setProperty("--reveal", self.progress.toFixed(3));
        }
      });
    });

    return;
  }

  let ticking = false;

  const updateReveal = () => {
    const viewportHeight = window.innerHeight;
    const startLine = viewportHeight * 0.92;
    const endLine = viewportHeight * 0.5;

    cards.forEach((card) => {
      const rect = card.getBoundingClientRect();
      const progress = clamp((startLine - rect.top) / (startLine - endLine), 0, 1);
      card.style.setProperty("--reveal", progress.toFixed(3));
    });

    ticking = false;
  };

  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateReveal);
  };

  updateReveal();
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
}
