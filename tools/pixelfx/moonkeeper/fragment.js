import { TAU, fit, sparkle } from "../../core/index.js";

export const meta = {
  name: "Fragment", desc: "An experience shard: a little golden crystal turning on the spot, glinting as it faces you.",
  tags: ["moonkeeper", "pickup", "loop"], size: [14, 14], origin: [7, 7], duration: 1, loop: true, fps: 12, bg: "dark",
  options: { palette: ["#3a2a10", "#7a5418", "#c08a22", "#e8c547", "#fff0a0", "#ffffff"], seed: 1 },
};

export function draw(p, t, o) {
  const C = fit(o.palette, 6), ph = t / meta.duration, c = Math.cos(ph * TAU), w = Math.abs(c) * 3 + 0.6, h = 4.5;
  p.poly([[0, -h], [w, 0], [0, h], [-w, 0]], C[1]);
  if (w > 1.2) {
    p.poly([[0, -h + 1], [w - 1, 0], [0, 0]], c > 0 ? C[4] : C[3]);
    p.poly([[0, -h + 1], [0, 0], [-(w - 1), 0]], c > 0 ? C[3] : C[2]);
    p.poly([[0, 0], [w - 1, 0], [0, h - 1]], C[2]);
  }
  p.glow(0, 0, 7, C[3], 0.35);
  if (w > 3.4) sparkle(p, -1, -2, 1.5, C[5], C[4], 0.4);
}
