import { gear, TURRET, G } from "./_gear.js";

export const meta = {
  name: "Basic turret", desc: "The starting gun: a small dome with a stubby barrel, its status light blinking.",
  tags: ["moonkeeper", "gear", "loop"], size: [16, 12], origin: [2, 6], duration: 1, loop: true, fps: 12, bg: "dark",
  options: { seed: 1 },
};

export function draw(p, t) {
  gear(p, TURRET);
  if (t % 1 < 0.5) p.light(3, 1, G.o, 0.6);
}
