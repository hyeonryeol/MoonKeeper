import { TAU, fit, fbm, clamp } from "../../core/index.js";
import { rock } from "./_lib.js";

export const meta = {
  name: "Large asteroid",
  desc: "A large dark iron-cored boulder turning slowly, pale mineral veins glinting in its cracks, the kind that splits into two medium rocks.",
  tags: ["moonkeeper", "asteroid", "rock", "loop"],
  size: [48, 48],
  origin: [24, 24],
  duration: 5,
  loop: true,
  fps: 12,
  bg: "dark",
  options: {
    palette: ["#0d0f18", "#1c2030", "#2f3547", "#4a5064", "#6c7184", "#9196a6", "#bcc0ca"],
    vein: ["#3f6f86", "#7fb8cc", "#d4f2fa"],
    seed: 27,
    radius: 18,
  },
};

export function draw(p, t, o) {
  const V = fit(o.vein, 3), ph = t / meta.duration;
  rock(p, 0, 0, o.radius, ph * TAU, fit(o.palette, 7), {
    seed: o.seed, rough: 0.2, pits: 6,
    extra(x, y, u, ang, out, lum) {
      // thin mineral veins drawn in the rock's own frame so they turn with it
      const bx = Math.cos(ang) * u * 2.2, by = Math.sin(ang) * u * 2.2;
      const v = Math.abs(fbm(bx + 11, by + 3, o.seed, 3));
      if (u > 0.9 || v > 0.035) return 0;
      const k = clamp(1 - v / 0.035) * (0.4 + 0.6 * lum);
      if (k > 0.75) { out.l = V[2]; out.k = 0.25; }
      return V[clamp(Math.floor(k * 2.99), 0, 2)];
    },
  });
}
