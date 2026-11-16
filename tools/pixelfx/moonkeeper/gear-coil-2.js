import { coil } from "./_levels.js";

export const meta = {
  name: "Lightning coil Lv2", desc: "Lightning coil upgraded to level 2: more parts, more light.",
  tags: ["moonkeeper", "gear", "upgrade", "loop"], size: [28,22], origin: [2,11], duration: 1, loop: true, fps: 12, bg: "dark",
  options: { seed: 4 },
};

export function draw(p, t, o) {
  coil(p, t, 2, o.seed);
}
