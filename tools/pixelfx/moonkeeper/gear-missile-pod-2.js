import { pod } from "./_levels.js";

export const meta = {
  name: "Missile pod Lv2", desc: "Missile pod upgraded to level 2: more parts, more light.",
  tags: ["moonkeeper", "gear", "upgrade", "loop"], size: [16,12], origin: [2,6], duration: 1, loop: true, fps: 12, bg: "dark",
  options: { seed: 4 },
};

export function draw(p, t, o) {
  pod(p, t, 2);
}
