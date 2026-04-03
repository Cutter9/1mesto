export function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

export const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function isLikelyLowPerformanceDevice() {
  const connection = navigator.connection;
  const saveDataEnabled = connection?.saveData === true;
  const effectiveType = typeof connection?.effectiveType === "string" ? connection.effectiveType : "";
  const hasSlowConnection = /(^slow-2g$|^2g$)/i.test(effectiveType);

  const hardwareThreads = navigator.hardwareConcurrency;
  const deviceMemory = navigator.deviceMemory;
  const hasLowThreadCount = typeof hardwareThreads === "number" && hardwareThreads > 0 && hardwareThreads <= 4;
  const hasLowMemory = typeof deviceMemory === "number" && deviceMemory > 0 && deviceMemory <= 4;

  return prefersReducedMotion || saveDataEnabled || hasSlowConnection || (hasLowThreadCount && hasLowMemory);
}
