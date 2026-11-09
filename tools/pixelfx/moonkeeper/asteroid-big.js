import { TAU, fit } from "../../core/index.js";
import { rock } from "./_lib.js";

export const meta = {
  name: "Big asteroid",
  desc: "A heavy cratered boulder turning slowly, the kind that splits into three when it breaks.",
  tags: ["moonkeeper", "asteroid", "rock", "loop"],
  size: [32, 32],
  origin: [16, 16],
  duration: 4,
  loop: true,
  fps: 12,
  bg: "dark",
  options: { palette: ["#141018", "#2a2130", "#47353f", "#6a4f4f", "#8f6c62", "#b38c78", "#d4b096"], seed: 9, radius: 11 },
};

export function draw(p, t, o) {
  rock(p, 0, 0, o.radius, (t / meta.duration) * TAU, fit(o.palette, 7), { seed: o.seed, rough: 0.16, pits: 4 });
}
