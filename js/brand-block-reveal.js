import { clamp, prefersReducedMotion } from "./utils.js";
import { getGsapRuntime } from "./gsap-runtime.js";

export function initBrandBlockReveal() {
  const section = document.querySelector(".brand-block");
  if (!section) return;

  const targets = Array.from(section.querySelectorAll(".brand-block__name, .brand-block__tagline"));
  if (!targets.length) return;

  if (prefersReducedMotion) return;

  const nameRevealShare = targets.length > 1 ? 0.66 : 1;
  const trailingShare = targets.length > 1 ? (1 - nameRevealShare) / (targets.length - 1) : 0;

  const groupRanges = targets.map((_, index) => {
    if (targets.length === 1) return { start: 0, end: 1 };
    if (index === 0) return { start: 0, end: nameRevealShare };
    const start = nameRevealShare + trailingShare * (index - 1);
    return { start, end: start + trailingShare };
  });

  const MASK = "linear-gradient(to right, black calc(var(--mask-pos) - 3ch), transparent calc(var(--mask-pos) + 3ch))";

  targets.forEach((target) => {
    target.style.webkitMaskImage = MASK;
    target.style.maskImage = MASK;
    target.style.setProperty("--mask-pos", "-5%");
  });

  const paintByProgress = (progress) => {
    targets.forEach((target, index) => {
      const range = groupRanges[index];
      const groupProgress = clamp((progress - range.start) / (range.end - range.start), 0, 1);
      target.style.setProperty("--mask-pos", `${(groupProgress * 110 - 5).toFixed(1)}%`);
    });
  };

  const runtime = getGsapRuntime();

  if (runtime?.ScrollTrigger) {
    paintByProgress(0);

    runtime.ScrollTrigger.create({
      trigger: section,
      start: "top bottom",
      end: "center center",
      scrub: true,
      onUpdate: (self) => {
        paintByProgress(Math.pow(self.progress, 1.18));
      }
    });

    return;
  }

  let ticking = false;

  const updateProgress = () => {
    const rect = section.getBoundingClientRect();
    const viewportHeight = window.innerHeight || 1;
    const startLine = viewportHeight;
    const endLine = viewportHeight * 0.5 - rect.height * 0.5;
    const distance = Math.max(1, startLine - endLine);
    const linearProgress = clamp((startLine - rect.top) / distance, 0, 1);
    paintByProgress(Math.pow(linearProgress, 1.15));
    ticking = false;
  };

  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateProgress);
  };

  paintByProgress(0);
  updateProgress();

  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
}
