export function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

export function mapRange(value, inMin, inMax, outMin, outMax) {
  const progress = (value - inMin) / (inMax - inMin);
  return outMin + progress * (outMax - outMin);
}
