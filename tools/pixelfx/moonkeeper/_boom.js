// A rock blowing apart in space: no floor, no gravity. A white flash, a shock ring, chunks that tumble away
// on drag, hot sparks, dust that swells and thins. Closed form, so any frame can be drawn on its own.
import { TAU, burst, fly, flyV, clamp, at, fit, smooth } from "../../core/index.js";

export const ROCK = ["#151320", "#2b2433", "#4a3d48", "#6e5a58", "#94786a", "#b89a82"];
export const HEAT = ["#4a1712", "#a8261a", "#f2561d", "#ffae35", "#ffe27a", "#ffffff"];

export function boom(p, t, o, S, D) {
  const R = fit(o.rock ?? ROCK, 6), H = fit(o.palette ?? HEAT, 6);
  // flash and core
  if (t < 0.05) p.circle(0, 0, 3.5 * S, H[5]);
  else if (t < 0.12) p.circle(0, 0, 3 * S * (1 - (t - 0.05) / 0.07) + 1, H[4]);
  p.glow(0, 0, 14 * S, H[3], 0.7 * Math.pow(clamp(1 - t / (0.35 * S)), 2));
  // shock ring
  const rt = clamp(t / (0.28 * S));
  if (rt < 1) {
    const rr = 2 + rt * 13 * S, n = Math.ceil(rr * 7);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      p.dot(Math.cos(a) * rr, Math.sin(a) * rr, rt < 0.4 ? H[4] : H[2], 1 - rt);
    }
  }
  // dust
  burst(Math.round(7 * S), o.seed + 1, (r) => {
    const a = r.range(0, TAU), sp = r.range(10, 26) * S, life = r.range(0.5, 0.9) * D, k = t / life;
    if (k >= 1) return;
    const [x, y] = fly(0, 0, Math.cos(a) * sp, Math.sin(a) * sp, t, 0, 2.5);
    p.disc(x, y, (1.5 + k * 3.5) * Math.sqrt(S), k < 0.2 ? H[2] : R[3], 0.55 * (1 - k));
  });
  // chunks
  burst(Math.round(6 * S), o.seed + 2, (r) => {
    const a = r.range(0, TAU), sp = r.range(25, 60) * S, life = r.range(0.6, 1) * D, k = t / life, sz = r.range(0.8, 1.6) * Math.sqrt(S);
    if (k >= 1) return;
    const [x, y] = fly(0, 0, Math.cos(a) * sp, Math.sin(a) * sp, t, 0, 1.6), spin = r.range(-12, 12) * t;
    for (let i = 0; i < 4; i++) {
      const ox = Math.cos(spin + i * 1.6) * sz, oy = Math.sin(spin + i * 1.6) * sz;
      p.dot(x + ox * 0.6, y + oy * 0.6, i === 0 ? R[5] : i === 3 ? R[1] : R[3], k < 0.7 ? 1 : (1 - k) / 0.3);
    }
    if (k < 0.3) p.light(x, y, H[3], 0.4 * (1 - k / 0.3));
  });
  // sparks
  burst(Math.round(12 * S), o.seed + 3, (r) => {
    const a = r.range(0, TAU), sp = r.range(50, 110) * S, life = r.range(0.2, 0.45) * D, k = t / life;
    if (k >= 1) return;
    const [x, y] = fly(0, 0, Math.cos(a) * sp, Math.sin(a) * sp, t, 0, 3);
    const [vx, vy] = flyV(Math.cos(a) * sp, Math.sin(a) * sp, t, 0, 3), s = 0.03;
    p.line(x - vx * s, y - vy * s, x, y, at([H[5], H[4], H[3], H[2]], k));
    p.light(x, y, H[3], 0.5 * (1 - k));
  });
}
