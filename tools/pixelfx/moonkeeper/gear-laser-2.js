import { laser } from "./_levels.js";

export const meta = {
  name: "Laser turret Lv2", desc: "Laser turret upgraded to level 2: more parts, more light.",
  tags: ["moonkeeper", "gear", "upgrade", "loop"], size: [24,14], origin: [2,7], duration: 1, loop: true, fps: 12, bg: "dark",
  options: { seed: 4 },
};

export function draw(p, t, o) {
  laser(p, t, 2);
}
