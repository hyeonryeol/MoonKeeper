// Skill cut-ins: a band slams across the screen, the hero bursts in big, the skill plays out, everything wipes away.
// 400 x 150, drawn 2x in game so it spans the 800 px screen. Skill names are left to the game's font.
import { TAU, clamp, seg, ease, rng, hex, lerp } from "../../core/index.js";
import * as moonFx from "./moon.js";
import * as earthFx from "./earth.js";

export const W = 400, H = 150, D = 0.9;
const NAVY = hex("#0e1330"), INK = hex("#070b1f"), WHITE = hex("#ffffff");
const TOP = 22, BOT = 128, SKEW = 36;

export const timing = (t) => ({
  open: ease.outCubic(seg(t, 0, 0.14)),
  close: ease.inCubic(seg(t, 0.72, D)),
  hold: seg(t, 0.14, 0.72),
});

export function at(p, x, y, fn) {
  const tx = p.tx, ty = p.ty, flip = p.fx < 0;
  p.place(tx + x, ty + y, flip);
  fn();
  p.place(tx, ty, flip);
}

/** The band: a slanted strip with accent rims, opening from the left and leaving to the right. */
export function band(p, t, accent, seed) {
  const { open, close } = timing(t);
  if (close >= 1) return null;
  const r = lerp(-SKEW, W + SKEW, open), l = lerp(-SKEW, W + SKEW, close);
  const left = (y) => l + (BOT - y) / (BOT - TOP) * SKEW - SKEW, right = (y) => r + (BOT - y) / (BOT - TOP) * SKEW;
  p.poly([[left(TOP), TOP], [right(TOP), TOP], [right(BOT), BOT], [left(BOT), BOT]], NAVY, 0.94);
  for (const [y, w] of [[TOP, 3], [BOT - 2, 3]]) p.rect(Math.max(0, left(y)), y, Math.min(W, right(y)) - Math.max(0, left(y)), w, accent);
  p.glowLine(Math.max(0, left(TOP)), TOP + 1, Math.min(W, right(TOP)), TOP + 1, 6, accent, 0.35);
  p.glowLine(Math.max(0, left(BOT)), BOT - 1, Math.min(W, right(BOT)), BOT - 1, 6, accent, 0.35);
  // speed lines racing left through the band
  for (let i = 0; i < 40; i++) {
    const g = rng(seed, i), y = g.range(TOP + 6, BOT - 6), len = g.range(18, 70), sp = g.range(700, 1300);
    let x = ((g.range(0, W + 200) - t * sp) % (W + 200) + W + 200) % (W + 200) - 100;
    const x0 = Math.max(x, left(y) + 2), x1 = Math.min(x + len, right(y) - 2);
    if (x1 > x0) p.line(x0, y, x1, y, g.chance(0.25) ? WHITE : accent, g.chance(0.25) ? 0.7 : 0.35);
  }
  return { left, right };
}

/** Where the hero sits: bursts in from the left with an overshoot, drifts, then flies off right. */
export function heroX(t, home) {
  const { close } = timing(t);
  const k = ease.outBack ? ease.outBack(seg(t, 0.04, 0.3)) : ease.outCubic(seg(t, 0.04, 0.3));
  return lerp(-70, home, k) + seg(t, 0.3, 0.72) * 10 + close * 520;
}

export function moon(p, t, x, y, R, aura) {
  p.glow(x, y, R * 1.7, aura, 0.45);
  at(p, x, y, () => moonFx.draw(p, t, { ...moonFx.meta.options, radius: R }));
}

export function earth(p, t, x, y, R, aura) {
  p.glow(x, y, R * 1.6, aura, 0.4);
  at(p, x, y, () => earthFx.draw(p, t * 4, { ...earthFx.meta.options, radius: R }));
}

/** Clip helper: is (x, y) inside the band right now. */
export const inside = (b, x, y) => b && y > TOP + 2 && y < BOT - 2 && x > b.left(y) && x < b.right(y);
export { TOP, BOT };
