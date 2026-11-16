import { thruster } from "./_levels.js";

export const meta = {
  name: "Thruster Lv2", desc: "Thruster upgraded to level 2: more parts, more light.",
  tags: ["moonkeeper", "gear", "upgrade", "loop"], size: [32,18], origin: [2,9], duration: 0.5, loop: true, fps: 12, bg: "dark",
  options: { seed: 4 },
};

export function draw(p, t, o) {
  thruster(p, t, 2, o.seed, meta.duration);
}
