import { laser } from "./_levels.js";

export const meta = {
  name: "Laser turret Lv3", desc: "Laser turret upgraded to level 3: gold trim, the most parts and the brightest light.",
  tags: ["moonkeeper", "gear", "upgrade", "loop"], size: [26,16], origin: [2,8], duration: 1, loop: true, fps: 12, bg: "dark",
  options: { seed: 5 },
};

export function draw(p, t, o) {
  laser(p, t, 3);
}
