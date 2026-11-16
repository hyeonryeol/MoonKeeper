import { TAU, clamp } from "../../core/index.js";
import { G } from "./_gear.js";

export const meta = {
  name: "Shield ring", desc: "A thin cyan force ring around the moon, a bright arc sweeping round it, flecks shimmering.",
  tags: ["moonkeeper", "gear", "scifi", "loop"], size: [56, 56], origin: [28, 28], duration: 2, loop: true, fps: 12, bg: "dark",
  options: { radius: 22, seed: 1 },
};

export function draw(p, t, o) {
  const ph = t / meta.duration, R = o.radius;
  p.disc(0, 0, R + 0.5, G.c, (d) => (d > R - 3 ? 0.14 : 0));
  for (let i = 0; i < 160; i++) {
    const a = (i / 160) * TAU, sweep = Math.cos(a - ph * TAU), x = Math.cos(a) * R, y = Math.sin(a) * R;
    const k = clamp((sweep - 0.55) / 0.45);
    p.blend(x, y, k > 0.6 ? G.w : G.c, 0.35 + 0.6 * k);
    p.blend(x * (R - 1) / R, y * (R - 1) / R, G.c, 0.12 + 0.35 * k);
    if (k > 0.2) p.light(x, y, G.c, 0.25 * k);
  }
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU + ph * TAU * 0.5, tw = Math.sin(ph * TAU * 3 + i * 1.7);
    if (tw > 0.4) p.px(Math.cos(a) * (R - 1), Math.sin(a) * (R - 1), G.w);
  }
  p.glowRing(0, 0, R, G.c, 0.18);
}
