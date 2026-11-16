import { drone } from "./_levels.js";

export const meta = {
  name: "Orbit drone Lv2", desc: "Orbit drone upgraded to level 2: more parts, more light.",
  tags: ["moonkeeper", "gear", "upgrade", "loop"], size: [14,12], origin: [7,6], duration: 1, loop: true, fps: 12, bg: "dark",
  options: { seed: 4 },
};

export function draw(p, t, o) {
  drone(p, t, 2);
}
