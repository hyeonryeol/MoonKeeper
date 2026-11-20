import { TAU, burst, fit, clamp, at } from "../../core/index.js";

export const meta = {
  name: "Orbit jump", desc: "The moon blinks to another orbit: a cyan ring snaps shut, speed lines streak in, a flash where it vanishes.",
  tags: ["moonkeeper", "scifi", "teleport", "one-shot"], size: [48, 48], origin: [24, 24], duration: 0.4, loop: false, fps: 12, bg: "dark",
  options: { palette: ["#14466e", "#2f9fd0", "#5fd4e0", "#bff6ff", "#ffffff"], seed: 5 },
};

export function draw(p, t, o) {
  const C = fit(o.palette, 5), k = t / meta.duration;
  const rr = 20 * (1 - k) + 1, n = Math.ceil(rr * 7);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    p.dot(Math.cos(a) * rr, Math.sin(a) * rr, k > 0.6 ? C[4] : C[2], 1 - k);
  }
  burst(10, o.seed, (r) => {
    const a = r.range(0, TAU), r0 = r.range(14, 22), q = clamp(k * 1.6 - r.range(0, 0.4));
    if (q <= 0 || q >= 1) return;
    const r1 = r0 * (1 - q), r2 = r1 + 5 * (1 - q);
    p.line(Math.cos(a) * r1, Math.sin(a) * r1, Math.cos(a) * r2, Math.sin(a) * r2, at([C[2], C[3], C[4]], q));
  });
  if (k > 0.75) p.circle(0, 0, 3 * (1 - (k - 0.75) / 0.25) + 0.5, C[4]);
  p.glow(0, 0, 10, C[2], 0.5 * k);
}
