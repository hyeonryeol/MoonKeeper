// Small skill pop-ups shown after a skill's first full cut-in: a slanted band the width of the wave indicator opens,
// the moon (or the earth) pops in and the skill plays out in miniature, then it all wipes off. 0.9 s, drawn 1x
// under the wave indicator in the top right. 212 x 52.
import { seg, ease, rng, hex, lerp, clamp, mix } from "../../core/index.js";
import * as moonFx from "./moon.js";
import * as earthFx from "./earth.js";

export const W = 212, H = 52, D = 0.9, CY = 26;
const TOP = 6, BOT = 46, SKEW = 14;
const NAVY = hex("#0e1330"), WHITE = hex("#ffffff");

export function popMeta(name, desc) {
  return { name, desc, tags: ["moonkeeper", "ui", "popup", "one-shot"], size: [W, H], origin: [0, 0], duration: D, loop: false, fps: 12, bg: "dark", options: { seed: 91 } };
}

export const timing = (t) => ({ open: ease.outCubic(seg(t, 0, 0.12)), close: ease.inCubic(seg(t, 0.74, D)) });

/** The band, returns its left and right edge at a given y, or null once it has gone. */
export function band(p, t, accent, seed) {
  const { open, close } = timing(t);
  if (close >= 1) return null;
  const r = lerp(-SKEW, W + SKEW, open), l = lerp(-SKEW, W + SKEW, close);
  const left = (y) => l + ((BOT - y) / (BOT - TOP)) * SKEW - SKEW, right = (y) => r + ((BOT - y) / (BOT - TOP)) * SKEW;
  p.poly([[left(TOP), TOP], [right(TOP), TOP], [right(BOT), BOT], [left(BOT), BOT]], NAVY, 0.92);
  for (const y of [TOP, BOT - 2]) {
    const a = Math.max(0, left(y)), b = Math.min(W, right(y));
    if (b > a) p.rect(a, y, b - a, 2, accent);
  }
  // speed lines racing left
  for (let i = 0; i < 16; i++) {
    const g = rng(seed, i), y = g.range(TOP + 5, BOT - 5), len = g.range(8, 26), sp = g.range(500, 900);
    const x = ((g.range(0, W + 80) - t * sp) % (W + 80) + W + 80) % (W + 80) - 40;
    const x0 = Math.max(x, left(y) + 1), x1 = Math.min(x + len, right(y) - 1);
    if (x1 > x0) p.line(x0, y, x1, y, g.chance(0.3) ? WHITE : accent, 0.4);
  }
  return { left, right };
}

/** Where the hero sits: pops in from the left, drifts, then flies off right with the band. */
export function heroX(t, home) {
  const { close } = timing(t);
  return lerp(-20, home, ease.outBack(seg(t, 0.04, 0.24))) + seg(t, 0.24, 0.72) * 4 + close * 260;
}

function at(p, x, y, fn) {
  const tx = p.tx, ty = p.ty;
  p.place(tx + x, ty + y);
  fn();
  p.place(tx, ty);
}

export function moon(p, t, x, y, aura) {
  p.glow(x, y, 18, aura, 0.4);
  at(p, x, y, () => moonFx.draw(p, t, { ...moonFx.meta.options, radius: 12 }));
}

export function earth(p, t, x, y, aura) {
  p.glow(x, y, 18, aura, 0.35);
  at(p, x, y, () => earthFx.draw(p, t * 4, { ...earthFx.meta.options, radius: 12 }));
}

export const inside = (b, x, y) => b && y > TOP + 1 && y < BOT - 1 && x > b.left(y) && x < b.right(y);
export { mix, clamp, seg, hex };
