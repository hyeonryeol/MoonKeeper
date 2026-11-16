import { coil } from "./_levels.js";

export const meta = {
  name: "Lightning coil Lv3", desc: "Lightning coil upgraded to level 3: gold trim, the most parts and the brightest light.",
  tags: ["moonkeeper", "gear", "upgrade", "loop"], size: [30,24], origin: [2,12], duration: 1, loop: true, fps: 12, bg: "dark",
  options: { seed: 5 },
};

export function draw(p, t, o) {
  coil(p, t, 3, o.seed);
}
