import { anchor } from "./_levels.js";

export const meta = {
  name: "Gravity anchor Lv2", desc: "Gravity anchor upgraded to level 2: more parts, more light.",
  tags: ["moonkeeper", "gear", "upgrade", "loop"], size: [26,22], origin: [3,11], duration: 2, loop: true, fps: 12, bg: "dark",
  options: { seed: 4 },
};

export function draw(p, t, o) {
  anchor(p, t, 2, meta.duration);
}
