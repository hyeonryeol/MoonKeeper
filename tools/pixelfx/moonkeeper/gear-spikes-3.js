import { spikes } from "./_levels.js";

export const meta = {
  name: "Spike armour Lv3", desc: "Spike armour upgraded to level 3: gold trim, the most parts and the brightest light.",
  tags: ["moonkeeper", "gear", "upgrade", "loop"], size: [14,20], origin: [2,10], duration: 1, loop: true, fps: 12, bg: "dark",
  options: { seed: 5 },
};

export function draw(p, t, o) {
  spikes(p, t, 3);
}
