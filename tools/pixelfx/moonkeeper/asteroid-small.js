import { TAU, fit } from "../../core/index.js";
import { rock } from "./_lib.js";

export const meta = {
  name: "Small asteroid",
  desc: "A small lumpy rock tumbling end over end, lit from the top left.",
  tags: ["moonkeeper", "asteroid", "rock", "loop"],
  size: [16, 16],
  origin: [8, 8],
  duration: 2,
  loop: true,
  fps: 12,
  bg: "dark",
  options: { palette: ["#151320", "#2b2433", "#4a3d48", "#6e5a58", "#94786a", "#b89a82"], seed: 2, radius: 5 },
};

export function draw(p, t, o) {
  rock(p, 0, 0, o.radius, (t / meta.duration) * TAU, fit(o.palette, 6), { seed: o.seed, rough: 0.2, pits: 1 });
}
