import { shield } from "./_levels.js";

export const meta = {
  name: "Shield ring Lv2", desc: "Shield ring upgraded to level 2: more parts, more light.",
  tags: ["moonkeeper", "gear", "upgrade", "loop"], size: [60,60], origin: [30,30], duration: 2, loop: true, fps: 12, bg: "dark",
  options: { seed: 4 },
};

export function draw(p, t, o) {
  shield(p, t, 2, 22, meta.duration);
}
