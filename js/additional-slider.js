import { clamp } from "./utils.js";
import { getGsapRuntime } from "./gsap-runtime.js";

export function initAdditionalSlider() {
  const root = document.querySelector("[data-additional-slider]");
  if (!root) return;

  const viewport = root.querySelector(".additional-slider__viewport");
  const track = root.querySelector(".additional-slider__track");
  const cards = Array.from(root.querySelectorAll(".additional-card"));
  const prevButton = root.querySelector("[data-additional-prev]");
  const nextButton = root.querySelector("[data-additional-next]");

  if (!viewport || !track || cards.length < 2 || !prevButton || !nextButton) return;

  const runtime = getGsapRuntime();
  const animateTrack = (x) => {
    if (runtime?.gsap) {
      runtime.gsap.to(track, { x, duration: 0.45, ease: "power3.out", overwrite: true });
      return;
    }

    track.style.transition = "transform 320ms ease";
    track.style.transform = `translate3d(${x}px, 0, 0)`;
  };

  let step = 0;
  let maxOffset = 0;
  let maxIndex = 0;
  let index = 0;
  const NEXT_DISABLE_TOLERANCE = 16;

  const updateMetrics = () => {
    const cardWidth = cards[0].offsetWidth;
    const gap = cards.length > 1 ? cards[1].offsetLeft - cards[0].offsetLeft - cardWidth : 0;
    step = cardWidth + Math.max(0, gap);
    maxOffset = Math.max(0, track.scrollWidth - viewport.clientWidth);

    if (step <= 0) {
      index = 0;
      maxIndex = 0;
    } else {
      maxIndex = Math.max(0, Math.ceil(maxOffset / step));
      index = clamp(index, 0, maxIndex);
    }
  };

  const updateArrows = () => {
    const currentOffset = Math.min(index * step, maxOffset);
    const remainingOffset = maxOffset - currentOffset;
    prevButton.disabled = currentOffset <= 0;
    nextButton.disabled = remainingOffset <= NEXT_DISABLE_TOLERANCE;
  };

  const render = (shouldAnimate = true) => {
    const currentOffset = Math.min(index * step, maxOffset);
    const x = -currentOffset;

    if (shouldAnimate) {
      animateTrack(x);
    } else {
      track.style.transform = `translate3d(${x}px, 0, 0)`;
    }

    updateArrows();
  };

  prevButton.addEventListener("click", () => {
    index -= 1;
    if (index < 0) index = 0;
    render();
  });

  nextButton.addEventListener("click", () => {
    index += 1;
    if (index > maxIndex) index = maxIndex;
    render();
  });

  const sync = () => {
    updateMetrics();
    render(false);
  };

  sync();
  window.addEventListener("resize", sync);
}
