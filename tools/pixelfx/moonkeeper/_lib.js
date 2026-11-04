// Shared bits for the Moon Keeper assets: one light from the top left, ordered dither, lumpy rocks.
import { clamp, TAU, Rng } from "../../core/index.js";

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
export const norm = (x, y, z) => { const l = Math.hypot(x, y, z) || 1; return [x / l, y / l, z / l]; };
export const LIGHT = norm(-0.62, -0.55, 0.56);
export const lambert = (n) => Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
export const bayer = (x, y) => BAYER[((Math.floor(y) & 3) << 2) | (Math.floor(x) & 3)] / 16 - 0.5;

/** Pick a ramp step for a brightness 0..1, a little dither on the boundaries only. */
export function step(C, v, x, y, lo = 1, dith = 0.3) {
  return C[clamp(Math.floor(lo + v * (C.length - lo - 0.6) + bayer(x, y) * dith), lo, C.length - 1)];
}

/** A lumpy outline: radius multiplier for a body-frame angle. */
export function lumps(seed, rough) {
  const r = new Rng(seed), waves = [];
  for (let k = 2; k <= 6; k++) waves.push([k, r.range(0, TAU), (rough * r.range(0.4, 1)) / (k * 0.7)]);
  return (a) => 1 + waves.reduce((s, [k, ph, amp]) => s + Math.sin(k * a + ph) * amp, 0);
}

/**
 * A tumbling rock lit from the top left: lumpy silhouette, pits that turn with it, dark rim on the night side.
 * extra(x, y, u, ang, out) may return a color to override a pixel (veins, ice), body-frame u 0..1 and angle.
 */
export function rock(p, cx, cy, R, spin, C, { seed = 1, rough = 0.18, pits = 4, extra } = {}) {
  const shape = lumps(seed, rough), rng = new Rng(seed * 13 + 5), holes = [];
  for (let i = 0; i < pits; i++) holes.push([rng.range(0.1, 0.65), rng.range(0, TAU), rng.range(0.16, 0.3)]);
  const reach = R * 1.5;
  p.shade(cx - reach, cy - reach, cx + reach, cy + reach, (x, y, out) => {
    const dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy), ang = Math.atan2(dy, dx), body = ang - spin;
    const rr = R * shape(body);
    if (d > rr) return 0;
    const u = d / rr, z = Math.sqrt(Math.max(0, 1 - u * u));
    let n = norm(Math.cos(ang) * u, Math.sin(ang) * u, z);
    for (const [hu, ha, hs] of holes) {
      const hx = Math.cos(ha + spin) * hu * R, hy = Math.sin(ha + spin) * hu * R, hr = hs * R;
      const ox = (dx - hx) / hr, oy = (dy - hy) / hr, od = Math.hypot(ox, oy);
      if (od > 1.35) continue;
      const k = od < 1 ? -0.9 : 0.7 * (1 - (od - 1) / 0.35);
      n = norm(n[0] + k * ox * 0.5, n[1] + k * oy * 0.5, n[2]);
      break;
    }
    const lum = lambert(n);
    if (extra) {
      const c = extra(x, y, u, body, out, lum);
      if (c) return c;
    }
    if (d > rr - 1) return lum < 0.2 ? C[0] : step(C, lum * 0.85, x, y);
    return step(C, lum, x, y);
  });
}
