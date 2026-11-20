// Title words drawn from Galmuri11 Bold pixel masks (see _words.js), scaled up by whole pixels, then painted with a
// height ramp, a 1 px top rim, a dark outline and a drop shadow. Effects pass extra touches through options.
import { clamp, hex, mix } from "../../core/index.js";
import { WORDS } from "./_words.js";

const INK = hex("#14162b"), SHADOW = hex("#070b1f"), WHITE = hex("#ffffff");
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
export const bayer = (x, y) => BAYER[((Math.floor(y) & 3) << 2) | (Math.floor(x) & 3)] / 16 - 0.5;
const AROUND = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]];

export function size(word, scale) {
  const d = WORDS[word];
  return { w: d.w * scale, h: d.h * scale };
}

/** The word's characters placed with their top left at x, y. */
export function pixelWord(word, scale, x, y) {
  const d = WORDS[word];
  const chars = d.chars.map((c) => ({ ch: c.ch, x: x + c.x * scale, y, w: c.rows[0].length * scale, rows: c.rows }));
  return { w: d.w * scale, h: d.h * scale, x, y, scale, chars };
}

function charHit(c, s, x, y, dy) {
  const gx = Math.floor((x - c.x) / s), gy = Math.floor((y - c.y - dy) / s);
  return gy >= 0 && gy < c.rows.length && gx >= 0 && gx < c.rows[0].length && c.rows[gy][gx] === "#";
}

/** Which character covers this pixel, or -1. dys moves characters up or down one by one. */
export function hitIndex(L, x, y, dys = []) {
  for (let i = 0; i < L.chars.length; i++) if (charHit(L.chars[i], L.scale, x, y, dys[i] || 0)) return i;
  return -1;
}

/**
 * Paint the word. o: { dys, sweep (x of a light band), flash(i) 0..1, gone(x, y), tint(x, y, c, out, i) }.
 */
export function paintWord(p, L, C, o = {}) {
  const dys = o.dys || [];
  const lo = Math.min(0, ...dys), hi = Math.max(0, ...dys);
  p.shade(L.x - 4, L.y + lo - 4, L.x + L.w + 6, L.y + L.h + hi + 6, (x, y, out) => {
    if (o.gone && o.gone(x, y)) return 0;
    const i = hitIndex(L, x, y, dys);
    if (i < 0) {
      for (const [dx, dy] of AROUND) if (hitIndex(L, x + dx, y + dy, dys) >= 0) return INK;
      if (hitIndex(L, x - 2, y - 3, dys) >= 0) return SHADOW;
      return 0;
    }
    const top = L.y + (dys[i] || 0);
    const v = clamp((y - top) / L.h);
    let c = C[clamp(Math.round((1 - v) * 3 + 0.6 + bayer(x, y) * 0.5), 1, 3)];
    if (hitIndex(L, x, y - 1, dys) < 0) c = C[4];
    if (o.flash) { const f = o.flash(i); if (f > 0) c = mix(c, WHITE, f); }
    if (o.sweep !== undefined) {
      const d = Math.abs(x - o.sweep - (y - top) * 0.5);
      if (d < 6) { c = mix(c, WHITE, 0.6 * (1 - d / 6)); out.l = C[4]; out.k = 0.4 * (1 - d / 6); }
    }
    if (o.tint) c = o.tint(x, y, c, out, i);
    return c;
  });
}
