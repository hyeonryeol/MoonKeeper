// Shared bits for the opening cinematic: 400 x 300 scenes drawn 2x in game, subtitles left to the game's font.
import { TAU, clamp, seg, hex, mix, rng, fbm, rand, tileFbm } from "../../core/index.js";

export const W = 400, H = 300;
export const SPACE = hex("#05081a"), INK = hex("#020205"), WHITE = hex("#ffffff");
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
export const bay = (x, y) => BAYER[((Math.floor(y) & 3) << 2) | (Math.floor(x) & 3)] / 16 - 0.5;
const DEEP = ["#03050f", "#070b1f", "#0e1330", "#161d44"].map(hex);
const STARS = [hex("#4a5078"), hex("#7f86ae"), hex("#c9cce0"), hex("#fbf4dc")];

/**
 * Deep space with a pixel nebula and three star layers. ox, oy pan the camera (far layers move less),
 * tint is a nebula color pair, warm 0..1 pushes it toward red (for the danger scenes).
 */
export function sky(p, seed, ox = 0, oy = 0, { tint = ["#3b2370", "#1f5a6e"], warm = 0, k = 1 } = {}) {
  const N = tint.map(hex), RED = hex("#5a1420");
  p.shade(0, 0, W, H, (x, y) => {
    const u = x + ox * 0.15, v = y + oy * 0.15;
    const n1 = fbm(u / 120, v / 120, seed, 4), n2 = fbm(u / 70 + 40, v / 70, seed + 9, 4);
    const b = bay(x, y) * 0.25, q = (z) => clamp(Math.round(z * 4 + b * 4) / 4);
    let c = mix(DEEP[1], DEEP[2], q(0.5 + n1 * 0.9));
    const a = q(clamp((n1 - 0.05) * 2.4)) * k, e = q(clamp((n2 - 0.12) * 2.2)) * k;
    if (a > 0) c = mix(c, N[0], a * 0.5);
    if (e > 0) c = mix(c, N[1], e * 0.4);
    if (warm > 0 && a > 0) c = mix(c, RED, a * warm * 0.6);
    return c;
  });
  // three layers: far dim dots, middle stars, near bright ones with glints
  for (const [layer, n, par] of [[0, 140, 0.2], [1, 60, 0.5], [2, 14, 1]]) {
    for (let i = 0; i < n; i++) {
      const g = rng(seed + layer * 31, i);
      const x = (((g.range(0, W) - ox * par) % W) + W) % W, y = (((g.range(0, H) - oy * par) % H) + H) % H;
      if (layer === 0) p.px(x, y, STARS[0]);
      else if (layer === 1) p.px(x, y, g.chance(0.3) ? STARS[2] : STARS[1]);
      else {
        const tw = 0.6 + 0.4 * Math.sin(g.range(0, TAU) + ox * 0.01 + i);
        p.px(x, y, STARS[3]);
        if (i % 2 === 0) for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) p.px(x + dx, y + dy, STARS[2]);
        p.glow(x, y, 5, STARS[2], 0.3 * tw);
      }
    }
  }
}

/** A true translucent wash over the whole screen (no dither): flashes and fades. Dark washes dim the glow too. */
export function wash(p, c, a, dimLight = false) {
  if (a <= 0.004) return;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) p.blendPx(x, y, c, Math.min(1, a));
  if (dimLight) scaleLight(p, 0, H, 1 - Math.min(1, a));
}
function scaleLight(p, y0, y1, k) {
  const L = p.L, w = p.w;
  for (let y = y0; y < y1; y++)
    for (let x = 0; x < w; x++) {
      const i = y * w + x, d = L[i];
      if (!d) continue;
      if (k <= 0) { L[i] = 0; continue; }
      const r = ((d & 255) * k) | 0, g = (((d >>> 8) & 255) * k) | 0, b = (((d >>> 16) & 255) * k) | 0;
      L[i] = (255 << 24) | (b << 16) | (g << 8) | r;
    }
}

/**
 * Finish a scene: cinema bars top and bottom (glow can't leak over them), a smooth fade in from black
 * and out to black at the end.
 */
export function finish(p, t, d, inT = 0.4, outT = 0.45, bar = 22) {
  p.place(0, 0);
  const k = clamp(Math.max(1 - seg(t, 0, inT), seg(t, d - outT, d - 0.05)));
  wash(p, INK, k, true);
  for (let y = 0; y < bar; y++) for (let x = 0; x < W; x++) { p.C[y * p.w + x] = INK; p.C[(H - 1 - y) * p.w + x] = INK; }
  scaleLight(p, 0, bar, 0);
  scaleLight(p, H - bar, H, 0);
}

/** Camera shake offsets. */
export const shake = (t, k) => [Math.round(Math.sin(t * 91) * k), Math.round(Math.cos(t * 73) * k)];

const GOLD = ["#3a2a10", "#7a5a20", "#c9a24a", "#f2d27a"].map(hex), CELL = ["#0a1430", "#173b8a", "#2f6fd0", "#8fc4ff"].map(hex);
const DEADC = ["#06080f", "#151a2a", "#2a3048", "#4a5068"].map(hex), METAL = ["#20202e", "#4a4658", "#8a8494", "#d8d2dc"].map(hex);
const GREEN = hex("#7dff9a"), RED = hex("#ff4a3a");

/**
 * A defense satellite drawn at any size: gold foil body, two framed solar panels of cells, a dish,
 * a lamp on a mast. state 1 working, 0.5 failing (red lamp), 0 dead (dark scorched panels).
 * burn 0..1 scorches it, s is the scale (1 is about 34 px wide).
 */
export function satellite(p, x, y, ang, state, t, i, s = 1, burn = 0) {
  const c = Math.cos(ang), sn = Math.sin(ang), R = 18 * s;
  const ok = state > 0.75, P = ok ? CELL : DEADC;
  p.shade(x - R - 2, y - R - 2, x + R + 2, y + R + 2, (X, Y) => {
    const dx = X - x, dy = Y - y, u = (dx * c + dy * sn) / s, v = (-dx * sn + dy * c) / s;
    const scorch = burn > 0 && rand(Math.floor(u), Math.floor(v), 77 + i) < burn * 0.7;
    const au = Math.abs(u);
    // panels
    if (au >= 5 && au <= 17 && Math.abs(v) <= 4.5) {
      if (au > 16.3 || Math.abs(v) > 3.9) return METAL[2];
      const cu = (au - 5) % 3, cv = (v + 4.5) % 3;
      if (cu < 0.45 || cv < 0.45) return METAL[1];
      if (scorch) return DEADC[0];
      const lit = (v < -1 ? 1 : 0) + (u < 0 ? 1 : 0);
      return P[Math.min(3, 1 + lit - (cv > 2.2 ? 1 : 0))];
    }
    // struts
    if (au > 3 && au < 5 && Math.abs(v) < 0.7) return METAL[2];
    // body: gold foil with crinkles, lit from the top left
    if (au <= 3.4 && Math.abs(v) <= 3.4) {
      if (au > 2.8 || Math.abs(v) > 2.8) return GOLD[1];
      if (scorch) return DEADC[1];
      const n = rand(Math.floor(u * 1.5), Math.floor(v * 1.5), 5 + i);
      return GOLD[clamp(Math.floor(2 - (u + v) * 0.18 + n * 1.4), 1, 3)];
    }
    // dish under the body
    const dd = Math.hypot(u, v - 6.2);
    if (v > 3.4 && dd < 3 && v < 6.8) return dd > 2.3 ? METAL[1] : METAL[3 - (u > 0 ? 1 : 0)];
    // mast with lamp
    if (Math.abs(u) < 0.6 && v < -3.4 && v > -7) return METAL[2];
    return 0;
  });
  const lx = x + sn * 7.5 * s, ly = y - c * 7.5 * s;
  if (ok && Math.sin(t * 5 + i * 1.7) > -0.2) {
    p.rect(lx - s * 0.6, ly - s * 0.6, Math.max(1, s * 1.2), Math.max(1, s * 1.2), GREEN);
    p.glow(lx, ly, 3 + 3 * s, GREEN, 0.45);
  }
  if (state > 0.2 && !ok && Math.sin(t * 22 + i) > 0) {
    p.rect(lx - s * 0.6, ly - s * 0.6, Math.max(1, s * 1.2), Math.max(1, s * 1.2), RED);
    p.glow(lx, ly, 3 + 4 * s, RED, 0.6);
  }
}

/** A jagged electric arc between two points, re-rolled every frame step. */
export function arc(p, x0, y0, x1, y1, t, seed, c, k = 1) {
  const step = Math.floor(t * 12), n = 6;
  let px = x0, py = y0;
  for (let i = 1; i <= n; i++) {
    const g = rng(seed + step * 13, i), f = i / n;
    const nx = x0 + (x1 - x0) * f + (i < n ? g.range(-5, 5) : 0), ny = y0 + (y1 - y0) * f + (i < n ? g.range(-5, 5) : 0);
    p.line(px, py, nx, ny, c, k);
    p.light(nx, ny, c, 0.6 * k);
    px = nx; py = ny;
  }
}

const FIRE = ["#4a1712", "#a8261a", "#f2561d", "#ff8a2a", "#ffc23d", "#ffe27a", "#ffffff"].map(hex);
/**
 * A big roaring engine jet from (x, y) pointing in direction ang: white core, orange body, red tips, noisy edges.
 * len is its length, wid the half width at the far end.
 */
export function jet(p, x, y, ang, len, wid, t, seed) {
  const c = Math.cos(ang), s = Math.sin(ang), R = len + wid + 4;
  p.shade(x - R, y - R, x + R, y + R, (X, Y, out) => {
    const dx = X - x, dy = Y - y, u = dx * c + dy * s, v = -dx * s + dy * c;
    if (u < 0 || u > len * 1.08) return 0;
    const f = u / len, n = tileFbm(u / 9 - t * 14, v / 6, 0, 0, seed, 3);
    const half = 3 + f * wid + n * 3 * f, d = Math.abs(v) / half;
    if (d > 1) return 0;
    const heat = clamp((1 - d) * (1.2 - f) + n * 0.25 - f * 0.1);
    if (heat < 0.06) return 0;
    out.k = 0.3 * heat; out.l = FIRE[4];
    return FIRE[clamp(Math.floor(heat * 7.5 + bay(X, Y) * 0.6), 0, 6)];
  });
  p.glow(x, y, wid * 1.6, FIRE[4], 0.55);
  p.glow(x + c * len * 0.4, y + s * len * 0.4, len * 0.5, FIRE[3], 0.22);
}

/** An expanding shock ring. */
export function shock(p, x, y, age, life, rmax, c) {
  if (age < 0 || age > life) return;
  const k = age / life, r = rmax * (1 - Math.pow(1 - k, 3));
  p.ring(x, y, r, Math.max(1, 4 * (1 - k)), c, 1 - k);
  p.glowRing(x, y, r, 6, c, 0.4 * (1 - k));
}

/** Translucent smoke puffs that grow and fade, lit on top. */
export function puffs(p, x, y, age, n, seed, spread, rise, life = 1.4) {
  const SM = ["#1a171e", "#2b2630", "#433d48", "#5d5660", "#7b6f72"].map(hex);
  for (let i = 0; i < n; i++) {
    const g = rng(seed, i), a0 = age - g.range(0, 0.5);
    if (a0 < 0 || a0 > life) continue;
    const k = a0 / life, ang = g.range(0, TAU);
    const px = x + Math.cos(ang) * spread * k * g.range(0.4, 1) + g.range(-4, 4);
    const py = y + Math.sin(ang) * spread * 0.5 * k * g.range(0.4, 1) - rise * k;
    const r = g.range(4, 9) * (0.5 + k);
    p.disc(px, py, r, (d, a) => SM[clamp(Math.floor(3.4 - d * 2 - Math.sin(a) * -1.2), 0, 4)], (1 - k) * 0.55);
  }
}

/** Debris chips that fly out from a point and spin. */
export function debris(p, x, y, age, n, seed, speed, colors) {
  if (age < 0) return;
  for (let i = 0; i < n; i++) {
    const g = rng(seed, i), ang = g.range(0, TAU), sp = g.range(0.4, 1) * speed;
    const life = g.range(0.8, 1.6);
    if (age > life) continue;
    const d = sp * age * (1 - age / (life * 2.2));
    const px = x + Math.cos(ang) * d, py = y + Math.sin(ang) * d;
    const sz = g.range(1, 3), spin = age * g.range(6, 14);
    const ex = Math.cos(spin) * sz, ey = Math.sin(spin) * sz;
    p.line(px - ex, py - ey, px + ex, py + ey, colors[i % colors.length]);
  }
}

/** A rotated box from (x, y) along ang: u 0..len, v -w..w. col(u, v) picks the color. */
export function box(p, x, y, ang, len, w, col) {
  const c = Math.cos(ang), s = Math.sin(ang), R = len + w + 2;
  p.shade(x - R, y - R, x + R, y + R, (X, Y) => {
    const dx = X - x, dy = Y - y, u = dx * c + dy * s, v = -dx * s + dy * c;
    if (u < 0 || u > len || Math.abs(v) > w) return 0;
    return col(u, v);
  });
}


export { TAU };
