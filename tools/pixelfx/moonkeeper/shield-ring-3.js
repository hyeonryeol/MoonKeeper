import { shield } from "./_levels.js";

export const meta = {
  name: "Shield ring Lv3", desc: "Shield ring upgraded to level 3: gold trim, the most parts and the brightest light.",
  tags: ["moonkeeper", "gear", "upgrade", "loop"], size: [60,60], origin: [30,30], duration: 2, loop: true, fps: 12, bg: "dark",
  options: { seed: 5 },
};

export function draw(p, t, o) {
  shield(p, t, 3, 22, meta.duration);
}
