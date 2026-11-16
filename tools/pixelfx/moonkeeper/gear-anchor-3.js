import { anchor } from "./_levels.js";

export const meta = {
  name: "Gravity anchor Lv3", desc: "Gravity anchor upgraded to level 3: gold trim, the most parts and the brightest light.",
  tags: ["moonkeeper", "gear", "upgrade", "loop"], size: [30,26], origin: [4,13], duration: 2, loop: true, fps: 12, bg: "dark",
  options: { seed: 5 },
};

export function draw(p, t, o) {
  anchor(p, t, 3, meta.duration);
}
