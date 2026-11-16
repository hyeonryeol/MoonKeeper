import { thruster } from "./_levels.js";

export const meta = {
  name: "Thruster Lv3", desc: "Thruster upgraded to level 3: gold trim, the most parts and the brightest light.",
  tags: ["moonkeeper", "gear", "upgrade", "loop"], size: [36,20], origin: [2,10], duration: 0.5, loop: true, fps: 12, bg: "dark",
  options: { seed: 5 },
};

export function draw(p, t, o) {
  thruster(p, t, 3, o.seed, meta.duration);
}
