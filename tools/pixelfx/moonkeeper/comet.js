import { TAU, fit, cycle, fly, at, clamp } from "../../core/index.js";
import { rock } from "./_lib.js";

export const meta = {
  name: "Comet",
  desc: "A fast icy comet heading right: a bright blue-white head and a flickering tail of ice streaming behind it.",
  tags: ["moonkeeper", "asteroid", "comet", "loop"],
  size: [60, 24],
  origin: [52, 12],
  duration: 1,
  loop: true,
  fps: 12,
  bg: "dark",
  options: {
    palette: ["#0c1430", "#162c5c", "#2f7fcc", "#58b4ec", "#9bdcff", "#d8f4ff", "#ffffff"],
    seed: 5,
  },
};

export function draw(p, t, o) {
  const C = fit(o.palette, 7), ph = t / meta.duration;
  // the tail: a soft cone, then flecks of ice blown back
  for (let i = 0; i < 24; i++) {
    const u = i / 24, w = 1.5 + u * 3, x = -u * 40;
    p.disc(x, Math.sin(ph * TAU + u * 6) * u * 1.2, w, u < 0.25 ? C[4] : C[3], 0.3 * Math.pow(1 - u, 1.6));
  }
  p.line(-2, 0, -22, 0, (u) => (u < 0.4 ? C[5] : C[4]), (u) => 0.8 * (1 - u));
  p.glowLine(-2, 0, -26, 0, 5, C[4], 0.25);
  cycle(t, meta.duration, 26, o.seed, (r) => r.range(0.35, 0.8), (age, L, r) => {
    const k = age / L, [x, y] = fly(-2, r.range(-1.5, 1.5), -r.range(40, 70), r.range(-6, 6), age);
    p.px(x, y, at([C[6], C[5], C[4], C[3], C[2]], k));
    if (k < 0.3) p.light(x, y, C[5], 0.4 * (1 - k));
  });
  p.glow(0, 0, 14, C[4], 0.4);
  rock(p, 0, 0, 3.6, ph * TAU, [C[1], C[2], C[3], C[4], C[5], C[6]], { seed: o.seed, rough: 0.12, pits: 1 });
  p.light(-1, -1, C[6], 0.6);
}
