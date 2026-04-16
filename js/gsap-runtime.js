let cachedRuntime = null;

export function getGsapRuntime() {
  if (cachedRuntime !== null) return cachedRuntime;

  const gsap = window.gsap;
  const ScrollTrigger = window.ScrollTrigger;

  if (!gsap) {
    cachedRuntime = null;
    return cachedRuntime;
  }

  if (ScrollTrigger) {
    try {
      gsap.registerPlugin(ScrollTrigger);
    } catch (_error) {
      // Plugin may already be registered.
    }
  }

  cachedRuntime = { gsap, ScrollTrigger: ScrollTrigger || null };
  return cachedRuntime;
}
