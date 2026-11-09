import { gear, COIL, G, zap } from "./_gear.js";

export const meta = {
  name: "Lightning coil", desc: "A copper coil crackling with blue arcs that jump off its tip.",
  tags: ["moonkeeper", "gear", "lightning", "loop"], size: [22, 16], origin: [2, 8], duration: 1, loop: true, fps: 12, bg: "dark",
  options: { seed: 4 },
};

export function draw(p, t, o) {
  gear(p, COIL);
  const f = Math.floor(t * 12);
  if (f % 3 !== 2) zap(p, t, 10, 0, 17, ((f * 5) % 7) - 3, o.seed);
  p.px(10, 0, G.w);
  p.glow(10, 0, 6, G.c, 0.35);
}
