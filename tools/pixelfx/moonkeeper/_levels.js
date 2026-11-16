// Level 2 and 3 looks for every piece of gear. More parts at Lv2, gold trim and more light at Lv3.
import { TAU, clamp, sparkle } from "../../core/index.js";
import {
  GP, G, gear, zap, plume, plume2, LASER, LASER2, LASER3, POD, POD2, POD3, SPIKES, SPIKES2, SPIKES3,
  NOZZLE, NOZZLE2, NOZZLE3, COIL, COIL2, COIL3, DRONE1, DRONE2, DRONE3,
} from "./_gear.js";
import { lambert, norm } from "./_lib.js";

const mid = (rows) => Math.floor(rows.length / 2);
const pick = (lv, list) => list[clamp(lv, 1, list.length) - 1];

export function laser(p, t, lv) {
  const rows = pick(lv, [LASER, LASER2, LASER3]), tip = rows[mid(rows)].length - 3;
  gear(p, rows);
  const rails = pick(lv, [[0], [-1, 1], [-2, 0, 2]]), k = t % 1;
  for (const y of rails) {
    p.px(5 + Math.floor(k * (tip - 5)), y, G.w);
    p.glow(tip, y, 4 + lv, G.c, 0.2 + 0.25 * Math.sin(k * Math.PI) ** 2);
  }
  if (lv >= 3) {
    p.light(4, -4, G.g, 0.6);
    p.light(4, 4, G.g, 0.6);
    if (k < 0.2) sparkle(p, tip + 1, 0, 2.5, G.w, G.c, 0.6);
  }
}

export function pod(p, t, lv) {
  const rows = pick(lv, [POD, POD2, POD3]), c = mid(rows);
  gear(p, rows);
  if (t % 1 < 0.25)
    rows.forEach((r, i) => { if (r.includes("rr")) p.light(r.indexOf("rr") + 1, i - c, G.r, 0.45); });
  if (lv >= 3) { p.light(1, -c + 1, G.g, 0.5); p.light(1, c - 1, G.g, 0.5); }
}

export function spikes(p, t, lv) {
  const rows = pick(lv, [SPIKES, SPIKES2, SPIKES3]), c = mid(rows);
  gear(p, rows);
  if (lv >= 3) {
    const tw = Math.floor(t * 6) % 5;
    rows.forEach((r, i) => {
      const x = r.lastIndexOf("g");
      if (x > 2) p.light(x, i - c, G.g, i % 5 === tw ? 0.8 : 0.3);
    });
  }
}

export function thruster(p, t, lv, seed, D) {
  if (lv <= 1) { plume(p, t, 9, 0, 9, seed, D); gear(p, NOZZLE); return; }
  plume2(p, t, 11, 0, lv === 2 ? 14 : 18, seed, D, lv >= 3);
  gear(p, lv === 2 ? NOZZLE2 : NOZZLE3);
  if (lv >= 3) p.light(4, 0, G.g, 0.5);
}

export function coil(p, t, lv, seed) {
  const rows = pick(lv, [COIL, COIL2, COIL3]), tip = rows[mid(rows)].length - 1, f = Math.floor(t * 12);
  gear(p, rows);
  for (let i = 0; i < lv; i++) {
    if ((f + i) % 3 === 2) continue;
    const ey = (((f + i * 3) * 5) % (5 + lv * 2)) - (2 + lv);
    zap(p, t, tip, 0, tip + 6 + lv, ey, seed + i * 7);
  }
  p.px(tip, 0, G.w);
  p.glow(tip, 0, 5 + lv * 1.5, lv >= 3 ? G.g : G.c, 0.3 + lv * 0.08);
}

export function drone(p, t, lv) {
  const rows = pick(lv, [DRONE1, DRONE2, DRONE3]), w = rows[0].length;
  p.sprite(rows, GP, -Math.floor(w / 2), -4);
  const on = t % 1 < 0.5;
  p.light(-w / 2, 0, on ? G.r : G.c, 0.5);
  p.light(w / 2 - 1, 0, on ? G.c : G.r, 0.5);
  p.glow(0, 0, 3 + lv, lv >= 3 ? G.g : G.c, 0.2 + lv * 0.08);
}

function ring(p, R, ph, col, hot, k0) {
  for (let i = 0; i < Math.ceil(R * 7.3); i++) {
    const a = (i / Math.ceil(R * 7.3)) * TAU, sweep = Math.cos(a - ph * TAU), x = Math.cos(a) * R, y = Math.sin(a) * R;
    const k = clamp((sweep - 0.55) / 0.45);
    p.blend(x, y, k > 0.6 ? hot : col, k0 + 0.6 * k);
    if (k > 0.2) p.light(x, y, col, 0.25 * k);
  }
}

export function shield(p, t, lv, R, D) {
  const ph = t / D;
  p.disc(0, 0, R + 0.5, G.c, (d) => (d > R - 3 ? 0.12 + 0.04 * lv : 0));
  ring(p, R, ph, G.c, G.w, 0.35);
  if (lv >= 2) ring(p, R - 3, -ph, G.c, G.w, 0.2);
  if (lv >= 3) ring(p, R + 3, ph * 2, G.g, G.w, 0.2);
  for (let i = 0; i < 6 * lv; i++) {
    const a = (i / (6 * lv)) * TAU + ph * TAU * 0.5, tw = Math.sin(ph * TAU * 3 + i * 1.7);
    if (tw > 0.4) p.px(Math.cos(a) * (R - 1), Math.sin(a) * (R - 1), lv >= 3 && i % 2 ? G.g : G.w);
  }
  p.glowRing(0, 0, R, lv >= 3 ? G.g : G.c, 0.14 + lv * 0.05);
}

export function anchor(p, t, lv, D) {
  const ph = t / D, cx = pick(lv, [9, 9, 10]), R = pick(lv, [3.6, 4.2, 5]), RR = R + 3;
  p.rect(0, -1, cx - R + 1, 2, G.k);
  p.rect(0, -0.5, cx - R + 1, 1, lv >= 3 ? G.g : G.m);
  const rings = [[RR * 1.8, RR * 0.6, 1], [RR * 0.6, RR * 1.6, -1.3], [RR * 1.5, RR * 1.5, 0.7]].slice(0, lv);
  const draw = (back) => {
    rings.forEach(([rx, ry, sp], j) => {
      for (let i = 0; i < 10; i++) {
        const a = ph * TAU * sp + (i / 10) * TAU + j, z = Math.sin(a + j);
        if ((z < 0) !== back) continue;
        p.px(cx + Math.cos(a) * rx, Math.sin(a) * ry, z < 0 ? G.P : lv >= 3 && j === 2 ? G.g : G.p);
      }
    });
  };
  draw(true);
  p.shade(cx - R - 1, -R - 1, cx + R + 1, R + 1, (x, y) => {
    const dx = (x - cx) / R, dy = y / R, d2 = dx * dx + dy * dy;
    if (d2 > 1) return 0;
    if (d2 > 0.72) return G.k;
    const l = lambert(norm(dx, dy, Math.sqrt(1 - d2)));
    if (lv >= 3 && d2 < 0.12) return G.g;
    return l > 0.75 ? G.w : l > 0.45 ? G.p : G.P;
  });
  draw(false);
  p.glow(cx, 0, 8 + lv * 2, G.p, 0.25 + lv * 0.07 + 0.1 * Math.sin(ph * TAU * 2));
}
