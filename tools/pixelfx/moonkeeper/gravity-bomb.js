import { TAU, burst, fit, clamp, at, ease } from "../../core/index.js";

export const meta = {
  name: "Gravity bomb", desc: "A violet well opens, motes spiral inward as the ring collapses, then a sharp pop at the centre.",
  tags: ["moonkeeper", "arcane", "implosion", "one-shot"], size: [96, 96], origin: [48, 48], duration: 1.3, loop: false, fps: 12, bg: "dark",
  options: { palette: ["#1a0f33", "#3b2370", "#5b3a9e", "#8a5fe0", "#b48cf5", "#e4d4ff", "#ffffff"], seed: 4, radius: 40 },
};

const POP = 0.95;

export function draw(p, t, o) {
  const C = fit(o.palette, 7), R = o.radius, k = clamp(t / POP);
  if (t < POP) {
    const rr = R * (1 - ease.inCubic(k)), n = Math.ceil(rr * 6) + 6;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU + k * 4;
      p.dot(Math.cos(a) * rr, Math.sin(a) * rr, i % 5 === 0 ? C[5] : C[3], 0.5 + 0.5 * k);
    }
    burst(36, o.seed, (r) => {
      const a0 = r.range(0, TAU), r0 = r.range(0.4, 1) * R, delay = r.range(0, 0.35);
      const q = clamp((t - delay) / (POP - delay));
      if (q <= 0 || q >= 1) return;
      const rad = r0 * (1 - ease.inQuad(q)), a = a0 + q * 3.2;
      p.px(Math.cos(a) * rad, Math.sin(a) * rad, at([C[3], C[4], C[5], C[6]], q));
    });
    p.disc(0, 0, rr * 0.8, C[1], 0.25 * k);
    p.glow(0, 0, 10 + 14 * k, C[4], 0.3 + 0.4 * k);
  } else {
    const q = (t - POP) / (meta.duration - POP);
    if (q < 0.15) p.circle(0, 0, 6, C[6]);
    const rr = 4 + q * 26, n = Math.ceil(rr * 7);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      p.dot(Math.cos(a) * rr, Math.sin(a) * rr, q < 0.4 ? C[5] : C[3], 1 - q);
    }
    p.glow(0, 0, 30, C[4], 0.8 * (1 - q) ** 2);
  }
}
