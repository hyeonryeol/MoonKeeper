import { TAU, cycle, fly, at, fit, tileFbm, clamp } from "../../core/index.js";

export const meta = {
  name: "Earth thruster", desc: "The planet's emergency engine firing: a long roaring jet facing right, white at the nozzle, cooling to red, sparks streaming off it.",
  tags: ["moonkeeper", "fire", "jet", "loop"], size: [80, 32], origin: [4, 16], duration: 0.5, loop: true, fps: 12, bg: "dark",
  options: { palette: ["#4a1712", "#a8261a", "#f2561d", "#ff8a2a", "#ffc23d", "#ffe27a", "#ffffff"], seed: 6, length: 60 },
};

export function draw(p, t, o) {
  const C = fit(o.palette, 7), ph = t / meta.duration, L = o.length;
  p.shade(0, -14, L + 6, 14, (x, y, out) => {
    const u = x / L;
    if (u < 0 || u > 1.1) return 0;
    const n = tileFbm(x / 6 - ph * 8, y / 4, 8, 0, o.seed, 3);
    const half = 2.5 + u * 9 + n * 2.2 * u, d = Math.abs(y) / half;
    if (d > 1) return 0;
    const heat = clamp((1 - d) * (1.15 - u) + n * 0.25 - u * 0.15);
    if (heat < 0.06) return 0;
    out.k = 0.25 * heat; out.l = C[4];
    return C[clamp(Math.floor(heat * 7.5), 0, 6)];
  });
  cycle(t, meta.duration, 22, o.seed, (r) => r.range(0.25, 0.5), (age, life, r) => {
    const [x, y] = fly(r.range(4, 20), r.range(-3, 3), r.range(80, 140), r.range(-30, 30), age, 0, 1);
    p.px(x, y, at([C[6], C[5], C[4], C[2], C[1]], age / life));
  });
  p.glow(4, 0, 20, C[4], 0.45);
  p.glow(L * 0.5, 0, L * 0.6, C[3], 0.2);
}
