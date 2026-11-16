import { drone } from "./_levels.js";

export const meta = {
  name: "Orbit drone Lv3", desc: "Orbit drone upgraded to level 3: gold trim, the most parts and the brightest light.",
  tags: ["moonkeeper", "gear", "upgrade", "loop"], size: [14,12], origin: [7,6], duration: 1, loop: true, fps: 12, bg: "dark",
  options: { seed: 5 },
};

export function draw(p, t, o) {
  drone(p, t, 3);
}
