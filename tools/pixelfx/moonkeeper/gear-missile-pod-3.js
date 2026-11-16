import { pod } from "./_levels.js";

export const meta = {
  name: "Missile pod Lv3", desc: "Missile pod upgraded to level 3: gold trim, the most parts and the brightest light.",
  tags: ["moonkeeper", "gear", "upgrade", "loop"], size: [18,14], origin: [2,7], duration: 1, loop: true, fps: 12, bg: "dark",
  options: { seed: 5 },
};

export function draw(p, t, o) {
  pod(p, t, 3);
}
