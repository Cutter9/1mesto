export function initRevealCards() {
  const cards = document.querySelectorAll("[data-reveal-card]");
  if (!cards.length) return;

  const clamp = (value, min, max) => Math.max(min, Math.min(value, max));

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
