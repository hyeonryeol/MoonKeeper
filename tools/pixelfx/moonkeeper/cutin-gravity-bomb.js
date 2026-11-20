import { TAU, seg, clamp, hex, rng, at as rampAt } from "../../core/index.js";
import { W, H, D, band, heroX, moon, timing, inside } from "./_cutin.js";

export const meta = {
  name: "Cut-in: gravity bomb", desc: "Skill cut-in: the band slams in, the moon bursts in and hurls a violet singularity that drags everything into a spinning vortex.",
  tags: ["moonkeeper", "cutin", "one-shot"], size: [W, H], origin: [0, 0], duration: D, loop: false, fps: 12, bg: "dark",
  options: { seed: 13 },
};

const P = ["#1a0f33", "#3b2370", "#5b3a9e", "#8a5fe0", "#b48cf5", "#e4d4ff", "#ffffff"].map(hex);

export function draw(p, t, o) {
  const b = band(p, t, P[4], o.seed);
  if (!b) return;
  const x = heroX(t, 90), y = 75, { close } = timing(t);
  const k = seg(t, 0.2, 0.4) * (1 - close), cx = 290 + close * 200;
  if (k > 0) {
    // spiral arms of motes pulled into the core
    for (let arm = 0; arm < 4; arm++)
      for (let i = 0; i < 60; i++) {
        const u = i / 60, r = (8 + u * 70) * k, a = arm * TAU / 4 + u * 5 - t * 9;
        const px = cx + Math.cos(a) * r * 1.3, py = y + Math.sin(a) * r * 0.75;
        if (inside(b, px, py)) p.px(px, py, rampAt([P[6], P[5], P[4], P[3], P[2]], u));
      }
    for (let i = 0; i < 40; i++) {
      const g = rng(o.seed, i), q = (t * g.range(1.2, 2.2) + g.next()) % 1, a = g.range(0, TAU) + q * 3;
      const r = (1 - q) * 80 * k, px = cx + Math.cos(a) * r * 1.3, py = y + Math.sin(a) * r * 0.75;
      if (inside(b, px, py)) p.line(px, py, px + Math.cos(a) * 4, py + Math.sin(a) * 3, P[5], 0.8);
    }
    p.disc(cx, y, 15 * k, P[0], 0.95);
    for (let i = 0; i < 60; i++) {
      const a = (i / 60) * TAU;
      p.px(cx + Math.cos(a) * 15 * k, y + Math.sin(a) * 15 * k, i % 4 === 0 ? P[6] : P[4]);
    }
    p.glow(cx, y, 70 * k, P[3], 0.75);
    p.glow(cx, y, 22 * k, P[5], 0.5);
  }
  moon(p, t, x, y, 44, P[3]);
}
