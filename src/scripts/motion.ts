// Shared easing helpers and the one global mode switch.
export const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
// Below 960px or with reduced motion nothing pins or scrubs; every stage
// renders its finished state. Decided once at load, like the prototype.
export const STATIC = RM || innerWidth < 960;

export const clamp = (v: number): number => (v < 0 ? 0 : v > 1 ? 1 : v);
export const range = (p: number, s: number, e: number): number => clamp((p - s) / (e - s));
export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
export const outCubic = (t: number): number => 1 - Math.pow(1 - t, 3);
export const outBack = (t: number): number => {
  const c = 1.70158;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
};
