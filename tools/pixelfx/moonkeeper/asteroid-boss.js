import { TAU, fit, fbm, clamp } from "../../core/index.js";
import { rock } from "./_lib.js";

export const meta = {
  name: "Giant asteroid",
  desc: "The wave 10 boss: a huge dark rock split by glowing magma cracks that pulse, turning slowly.",
  tags: ["moonkeeper", "asteroid", "boss", "loop"],
  size: [200, 200],
  origin: [100, 100],
  duration: 8,
  loop: true,
  fps: 12,
  bg: "dark",
  options: {
    palette: ["#0e0a12", "#1f1720", "#35262e", "#4e3638", "#6c4a44", "#8c6253"],
    magma: ["#4a1712", "#a8261a", "#f2561d", "#ffae35", "#ffe27a"],
    seed: 21,
    radius: 80,
  },
};

export function draw(p, t, o) {
  const C = fit(o.palette, 6), M = fit(o.magma, 5), ph = t / meta.duration, R = o.radius;
  const pulse = 0.5 + 0.5 * Math.sin(ph * TAU * 4);
  p.glow(0, 0, R * 1.3, M[2], 0.12 + 0.06 * pulse);
  rock(p, 0, 0, R, ph * TAU, C, {
    seed: o.seed, rough: 0.14, pits: 6,
    extra(x, y, u, ang, out, lum) {
      // cracks: thin ridges of a noise field drawn in the rock's own frame, so they turn with it
      const bx = Math.cos(ang) * u * 1.8, by = Math.sin(ang) * u * 1.8;
      const v = Math.abs(fbm(bx + 5, by + 5, o.seed, 3)), w = 0.045 * (1 - u * 0.6);
      if (u > 0.86 || v > w) return 0;
      const heat = clamp(1 - v / w) * (0.6 + 0.4 * pulse) * (0.5 + 0.5 * lum + 0.3);
      out.k = 0.6 * heat; out.l = M[3];
      return M[clamp(Math.floor(1 + heat * 3.6), 1, 4)];
    },
  });
}
