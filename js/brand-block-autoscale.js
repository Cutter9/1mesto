const BASE_WIDTH = 1440;
const MIN_DESKTOP_WIDTH = BASE_WIDTH + 1;
const MAX_SCALE = 2.2;

export function initBrandBlockAutoscale() {
  const section = document.querySelector(".brand-block");
  const frame = section?.querySelector(".brand-block__frame");
  if (!section || !frame) return;

  let resizeObserver = null;
  let rafId = 0;

  const resetScale = () => {
    section.classList.remove("brand-block--autoscaled");
    section.style.removeProperty("--brand-block-scale");
    section.style.removeProperty("--brand-block-scaled-height");
  };

  const applyScale = () => {
    const viewportWidth = window.innerWidth || 0;

    if (viewportWidth < MIN_DESKTOP_WIDTH) {
      resetScale();
      return;
    }

    const scale = Math.min(viewportWidth / BASE_WIDTH, MAX_SCALE);
    const baseHeight = frame.scrollHeight;

    section.classList.add("brand-block--autoscaled");
    section.style.setProperty("--brand-block-scale", scale.toFixed(4));
    section.style.setProperty("--brand-block-scaled-height", `${Math.ceil(baseHeight * scale)}px`);
  };

  const scheduleUpdate = () => {
    if (rafId) return;

    rafId = window.requestAnimationFrame(() => {
      rafId = 0;
      applyScale();
    });
  };

  if ("ResizeObserver" in window) {
    resizeObserver = new ResizeObserver(scheduleUpdate);
    resizeObserver.observe(frame);
  }

  window.addEventListener("resize", scheduleUpdate, { passive: true });
  window.addEventListener("orientationchange", scheduleUpdate, { passive: true });
  window.addEventListener("load", scheduleUpdate, { once: true });

  applyScale();

  return () => {
    if (rafId) {
      window.cancelAnimationFrame(rafId);
      rafId = 0;
    }

    if (resizeObserver) resizeObserver.disconnect();
    window.removeEventListener("resize", scheduleUpdate);
    window.removeEventListener("orientationchange", scheduleUpdate);
    resetScale();
  };
}
