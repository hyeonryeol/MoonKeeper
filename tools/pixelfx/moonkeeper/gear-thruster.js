import { gear, NOZZLE, plume } from "./_gear.js";

export const meta = {
  name: "Thruster", desc: "An engine bell bolted to the moon, a short flame roaring out of it.",
  tags: ["moonkeeper", "gear", "fire", "loop"], size: [28, 14], origin: [2, 7], duration: 0.5, loop: true, fps: 12, bg: "dark",
  options: { seed: 3 },
};

export function draw(p, t, o) {
  plume(p, t, 9, 0, 9, o.seed, meta.duration);
  gear(p, NOZZLE);
}
