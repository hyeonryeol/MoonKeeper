import { gear, POD, G } from "./_gear.js";

export const meta = {
  name: "Missile pod", desc: "A box launcher with two red-tipped homing missiles racked and ready.",
  tags: ["moonkeeper", "gear", "loop"], size: [16, 12], origin: [2, 6], duration: 1, loop: true, fps: 12, bg: "dark",
  options: { seed: 1 },
};

export function draw(p, t) {
  gear(p, POD);
  if (t % 1 < 0.25) { p.light(9, -2, G.r, 0.4); p.light(9, 1, G.r, 0.4); }
}
