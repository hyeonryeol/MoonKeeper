import { gear, LASER, G } from "./_gear.js";

export const meta = {
  name: "Laser turret", desc: "A long emitter with a cyan core charging along its barrel, the tip glowing.",
  tags: ["moonkeeper", "gear", "loop"], size: [18, 12], origin: [2, 6], duration: 1, loop: true, fps: 12, bg: "dark",
  options: { seed: 1 },
};

export function draw(p, t) {
  gear(p, LASER);
  const k = t % 1, x = 5 + Math.floor(k * 6);
  p.px(x, 0, G.w);
  p.glow(11, 0, 5, G.c, 0.25 + 0.25 * Math.sin(k * Math.PI * 2) ** 2);
}
