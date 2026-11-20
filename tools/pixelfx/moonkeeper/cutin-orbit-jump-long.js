import { TAU, seg, clamp, hex, lerp, ease, rng, sparkle } from "../../core/index.js";
import { W, H, CY, D, IRON, BRASS, tone, sequence, limb, FLASH } from "./_longcut.js";
import * as moonFx from "./moon.js";

export const meta = {
  name: "Cut-in: orbit jump, long",
  desc: "Long skill cut-in: two brass antenna pylons fork out of the moon with cyan crystals, a great riveted warp gate unfolds ahead of it with a swirling portal, energy arcs from the crystals into the gate, then the moon unravels into light, is pulled through, and bursts out of an exit gate far to the right leaving afterimages as the camera follows.",
  tags: ["moonkeeper", "cutin", "one-shot"], size: [W, H], origin: [0, 0], duration: D, loop: false, fps: 12, bg: "dark",
  options: { seed: 47 },
};

const F = ["#0a2a3a", "#14466e", "#2f9fd0", "#5fd4e0", "#9ff0ff", "#d8fbff", "#ffffff"].map(hex);
const PYLON = [0.5, 0.9], GATE = [0.85, 1.2], LIGHT = [1.1, 1.32], EXIT = [1.62, 1.8], OUT = 1.74;
const GATE_RY = 52, GATE_RX = 14, GATE_AT = 128, JUMP = 230;

const pylonE = (t) => ease.outBack(seg(t, PYLON[0], PYLON[1]));
const gateX = (k) => k.x0 + GATE_AT;
const exitX = (k) => gateX(k) + JUMP;

function mount(p, k) {
  const e = pylonE(k.t);
  if (e <= 0.01 || k.t > FLASH) return;
  const { ex, R } = k, grow = Math.min(1, e), h = 46 * grow, span = Math.asin(clamp(h / R, 0, 0.98));
  p.shade(ex + R * 0.2, CY - R, ex + R + 20, CY + R, (x, y, out) => {
    const dx = x - ex, dy = y - CY, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
    if (Math.abs(a) > span || dx < 0) return 0;
    const u = Math.abs(a) / span, outerR = R + 2 + 12 * grow * Math.cos(u * Math.PI / 2);
    if (r < R - 3 && r > R - 11) { out.a = 0.5 * (1 - (R - 3 - r) / 8) * (1 - u); return IRON[0]; }
    if (r < R - 3 || r > outerR) return 0;
    if (r > outerR - 1 || r < R - 2) return IRON[0];
    if (r > outerR - 3) return dy < 0 ? BRASS[4] : BRASS[2];
    if (Math.round(a * R) % 6 === 0 && Math.abs(r - (R + 2)) < 0.8) return IRON[5];
    return dy / R < -0.3 ? IRON[4] : dy / R < 0.3 ? IRON[3] : IRON[2];
  });
}

// two pylons forking out like a tuning fork, a crystal on each tip
function pylons(p, k) {
  const e = pylonE(k.t);
  if (e <= 0.01 || k.t > FLASH) return [];
  const lit = seg(k.t, LIGHT[0], LIGHT[1]), tips = [];
  for (const side of [-1, 1]) {
    const ay = CY + side * 22, ax = limb(k.ex, k.R + 10, ay);
    const pts = [];
    for (let i = 0; i <= 12; i++) {
      const u = i / 12, x = ax + 62 * e * u, y = ay + side * (26 * e) * Math.sin(u * Math.PI * 0.6);
      pts.push([x, y]);
    }
    for (let w = -2; w <= 2; w++) p.polyline(pts.map(([x, y]) => [x, y + w]), Math.abs(w) === 2 ? BRASS[0] : w < 0 ? BRASS[4] : BRASS[2]);
    for (const [i, r] of [[4, 3], [8, 3]]) { p.circle(pts[i][0], pts[i][1], r, IRON[0]); p.circle(pts[i][0], pts[i][1], r - 1, IRON[3]); }
    const [tx, ty] = pts[12];
    // the crystal: a cut gem that fills with light
    p.poly([[tx, ty - 7], [tx + 5, ty], [tx, ty + 7], [tx - 4, ty]], IRON[0]);
    p.poly([[tx, ty - 5], [tx + 3, ty], [tx, ty + 5], [tx - 2, ty]], lit > 0 ? F[4] : IRON[2]);
    p.poly([[tx, ty - 5], [tx + 3, ty], [tx, ty]], lit > 0 ? F[6] : IRON[3]);
    if (lit > 0) p.glow(tx, ty, 10 + 8 * lit, F[4], 0.5 * lit);
    tips.push([tx, ty]);
  }
  return tips;
}

// a warp gate: a segmented ring of riveted plates, a swirling portal inside
function gate(p, gx, open, t, inner) {
  if (open <= 0.01) return;
  const ry = GATE_RY * open, rx = GATE_RX * Math.max(0.4, open);
  p.shade(gx - rx - 6, CY - ry - 6, gx + rx + 6, CY + ry + 6, (x, y, out) => {
    const ex = (x - gx) / rx, ey = (y - CY) / ry, r = Math.hypot(ex, ey), ang = Math.atan2(ey, ex);
    const sg = Math.floor(((ang + Math.PI) / TAU) * 20), tall = sg % 2 === 0, wall = 1 + (tall ? 0.1 : 0.04);
    if (r > wall) return 0;
    if (r > 0.82) {
      if (r > wall - 0.04) return IRON[0];
      const edge = Math.abs(((ang + Math.PI) / TAU) * 20 - sg - 0.5) > 0.4;
      return edge ? IRON[0] : ey < 0 ? (tall ? BRASS[4] : IRON[4]) : tall ? BRASS[2] : IRON[2];
    }
    if (r > 0.78) return IRON[0];
    // the portal: a spiral of light turning inside the ring
    const sw = Math.sin(ang * 3 + r * 9 - t * 14);
    if (inner <= 0) return IRON[0];
    out.a = clamp(inner * (0.55 + 0.35 * sw));
    return r < 0.25 ? F[6] : sw > 0.4 ? F[5] : sw > -0.2 ? F[4] : F[2];
  });
  if (inner > 0) p.glow(gx, CY, ry * 1.1, F[4], 0.35 * inner);
}

function arcs(p, k, tips) {
  const c = seg(k.t, LIGHT[1], FLASH);
  if (c <= 0 || k.t > FLASH) return;
  const f = Math.floor(k.t * 12), gx = gateX(k);
  for (const [i, [tx, ty]] of tips.entries()) {
    const r = rng(k.seed, f * 3 + i);
    let px = tx, py = ty;
    for (let s = 1; s <= 6; s++) {
      const u = s / 6, nx = lerp(tx, gx - GATE_RX, u), ny = lerp(ty, CY + (ty - CY) * 0.6, u) + r.range(-4, 4) * (1 - Math.abs(u - 0.5) * 2 + 0.2);
      p.line(px, py, nx, ny, s % 2 ? F[6] : F[5]);
      px = nx; py = ny;
    }
  }
}

function shot(p, k) {
  const gx = gateX(k), xx = exitX(k), since = k.t - FLASH;
  // the moon unravels into streaks pulled into the entry gate
  if (since < 0.2) for (let i = 0; i < 30; i++) {
    const g = rng(k.seed + 3, i), a = g.range(0, TAU), r = g.range(0, k.R), q = clamp(since / 0.2 + g.range(-0.2, 0.2));
    const sx = k.ex + Math.cos(a) * r, sy = CY + Math.sin(a) * r, x = lerp(sx, gx, q), y = lerp(sy, CY, q);
    p.line(x, y, x - 18 * (1 - q), y, F[6], 1 - q * 0.5);
  }
  // a tunnel of light linking the gates while the moon is in transit
  const tunnel = seg(k.t, FLASH, FLASH + 0.08) * (1 - seg(k.t, OUT, OUT + 0.2));
  if (tunnel > 0) {
    p.glowLine(gx, CY, xx, CY, 36 * tunnel, F[4], 0.5);
    for (let i = 0; i < 6; i++) { const y = CY + (i - 2.5) * 9; p.line(gx, y, xx, y, i % 2 ? F[5] : F[6], 0.7 * tunnel); }
  }
  // afterimages of the moon strung between the gates once it has come out
  const out = seg(k.t, OUT, OUT + 0.4);
  if (out > 0 && out < 1)
    for (let i = 1; i <= 4; i++) {
      const x = lerp(gx, xx + 70, i / 5), a = 0.35 * (1 - out) * (i / 4);
      p.disc(x, CY, k.R * 0.9, F[3], a);
      p.disc(x - 6, CY - 6, k.R * 0.6, F[5], a * 0.6);
    }
}

export function draw(p, t, o) {
  sequence(p, t, o, F, {
    mouth: (k) => gateX(k),
    follow: (k) => (k.t < FLASH ? gateX(k) : lerp(gateX(k), exitX(k) + 70, ease.inOutCubic(seg(k.t, FLASH, 2.1)))),
    hero: (k) => {
      if (k.t < FLASH) return { x: k.ex, show: true, scale: 1 };
      if (k.t < OUT) return { x: k.ex, show: false, scale: 1 };
      // it bursts out of the exit gate and slides to a stop
      const q = ease.outBack(seg(k.t, OUT, OUT + 0.3));
      return { x: lerp(exitX(k), exitX(k) + 70, ease.outCubic(seg(k.t, OUT, OUT + 0.4))), show: true, scale: Math.max(0.2, q) };
    },
    shot,
    behind(p, k) {
      const open = ease.outBack(seg(k.t, GATE[0], GATE[1])) * (1 - seg(k.t, FLASH + 0.1, FLASH + 0.4));
      gate(p, gateX(k), open, k.t, seg(k.t, GATE[1] - 0.1, LIGHT[1]) * (k.t > FLASH + 0.1 ? 1 - seg(k.t, FLASH + 0.1, FLASH + 0.4) : 1));
      const ex = ease.outBack(seg(k.t, EXIT[0], EXIT[1])) * (1 - seg(k.t, 2.35, 2.6));
      gate(p, exitX(k), ex, k.t, ex);
    },
    draw(p, k) {
      mount(p, k);
      const tips = pylons(p, k);
      arcs(p, k, tips);
    },
  });
}
