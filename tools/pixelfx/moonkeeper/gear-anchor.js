import { TAU } from "../../core/index.js";
import { G } from "./_gear.js";
import { lambert, norm } from "./_lib.js";

export const meta = {
  name: "Gravity anchor", desc: "A dark violet orb on a short stem, a ring of motes orbiting it, slowing whatever comes close.",
  tags: ["moonkeeper", "gear", "arcane", "loop"], size: [20, 16], origin: [2, 8], duration: 2, loop: true, fps: 12, bg: "dark",
  options: { seed: 1 },
};

export function draw(p, t) {
  const ph = t / meta.duration, cx = 9, R = 3.6;
  p.rect(0, -1, 5, 2, G.k);
  p.rect(0, -0.5, 5, 1, G.m);
  const ring = (back) => {
    for (let i = 0; i < 10; i++) {
      const a = ph * TAU + (i / 10) * TAU, z = Math.sin(a);
      if ((z < 0) !== back) continue;
      p.px(cx + Math.cos(a) * 6.5, Math.sin(a) * 2.2, z < 0 ? G.P : G.p);
    }
  };
  ring(true);
  p.shade(cx - R - 1, -R - 1, cx + R + 1, R + 1, (x, y) => {
    const dx = (x - cx) / R, dy = y / R, d2 = dx * dx + dy * dy;
    if (d2 > 1) return 0;
    if (d2 > 0.72) return G.k;
    const l = lambert(norm(dx, dy, Math.sqrt(1 - d2)));
    return l > 0.75 ? G.w : l > 0.45 ? G.p : G.P;
  });
  ring(false);
  p.glow(cx, 0, 9, G.p, 0.3 + 0.1 * Math.sin(ph * TAU * 2));
}
