import { spikes } from "./_levels.js";

export const meta = {
  name: "Spike armour Lv2", desc: "Spike armour upgraded to level 2: more parts, more light.",
  tags: ["moonkeeper", "gear", "upgrade", "loop"], size: [14,20], origin: [2,10], duration: 1, loop: true, fps: 12, bg: "dark",
  options: { seed: 4 },
};

export function draw(p, t, o) {
  spikes(p, t, 2);
}
