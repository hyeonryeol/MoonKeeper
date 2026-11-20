import { TAU, seg, clamp, hex, lerp, ease, rng, rand, tileFbm, sparkle } from "../../core/index.js";
import { band, at } from "./_cutin.js";
import * as earthFx from "./earth.js";

export const W = 400, H = 225;
export const meta = {
  name: "Cut-in: earth thruster, long", desc: "Long skill cut-in: the screen darkens, the Earth glints, a colossal engine slides out of its back, gathers light and ignites in a flash and shockwave, then the band slams in and the Earth roars across on a pillar of fire.",
  tags: ["moonkeeper", "cutin", "one-shot"], size: [W, H], origin: [0, 0], duration: 2.8, loop: false, fps: 12, bg: "dark",
  options: { seed: 21 },
};

const F = ["#0a1a4a", "#123a8c", "#1f6fd0", "#3fa8f0", "#7fdcff", "#c8f4ff", "#ffffff"].map(hex);
const M = { k: hex("#14162b"), d: hex("#3a3f5c"), m: hex("#6b7394"), l: hex("#a9b4d0"), w: hex("#eef3ff"), g: hex("#ffd34a"), n: hex("#b07a1e") };
const VEIL = hex("#070b1f"), CY = H / 2;
const GLINT = [0.18, 0.5], CHARGE = [1.32, 1.6], FLASH = 1.6, BAND = [1.78, 2.8];

// the engine: a colossal radial engine. An armoured drum slides out of the planet on gold truss braces, then
// its round face opens like an umbrella into a ring wall of plates, eight teal spokes running to a hub and
// sectors packed with nozzles that glow red one sector at a time, turning blue-white at ignition
const IRON = ["#0b0d1c", "#20253a", "#3a4058", "#5e6680", "#9aa3bc", "#dfe5f2"].map(hex);
const GOLD = ["#3a2810", "#7a5a24", "#c09440", "#f0cc70"].map(hex);
const TEAL = ["#1a3a38", "#3a6a64", "#6aa898", "#a8dccc"].map(hex);
const EMBER = ["#3a0e0e", "#8a1e1a", "#e0442a", "#ff9a6a"].map(hex);
const DRUM = 40, DRUM_H = 44, FACE_RY = 58, FACE_RX = 26;
const SLIDE = [0.5, 0.85], OPEN = [0.85, 1.15], LIGHTS = [1.1, 1.36];
const shade = (pal, v) => pal[clamp(Math.round(lerp(pal.length - 2, 1, (v + 1) / 2)), 0, pal.length - 1)];

function truss(p, xa, xb, y0, y1) {
  // two gold rails and a zigzag lattice between them
  p.line(xa, y0, xb, y0, GOLD[2]);
  p.line(xa, y1, xb, y1, GOLD[1]);
  const n = Math.max(1, Math.round(Math.abs(xb - xa) / 7));
  for (let i = 0; i < n; i++) {
    const u0 = i / n, u1 = (i + 1) / n;
    p.line(lerp(xa, xb, u0), i % 2 ? y0 : y1, lerp(xa, xb, u1), i % 2 ? y1 : y0, GOLD[3]);
  }
  p.px(xa, y0, GOLD[0]); p.px(xb, y0, GOLD[0]);
}

function face(p, fx, open, t, lit, power) {
  const ry = FACE_RY * (0.3 + 0.7 * open), rx = FACE_RX * (0.3 + 0.7 * open);
  p.shade(fx - rx - 4, CY - ry - 6, fx + rx + 4, CY + ry + 6, (x, y) => {
    const ex = (x - fx) / rx, ey = (y - CY) / ry, r = Math.hypot(ex, ey), ang = Math.atan2(ey, ex);
    const segN = 24, sg = Math.floor(((ang + Math.PI) / TAU) * segN), tall = sg % 2 === 0;
    // the ring wall of armour plates, every other one standing proud like a crown
    const wall = 1 + (tall ? 0.09 * open : 0.03);
    if (r > wall) return 0;
    if (r > 0.8) {
      if (r > wall - 0.03) return IRON[0];
      const edge = Math.abs(((ang + Math.PI) / TAU) * segN - sg - 0.5) > 0.42;
      return edge ? IRON[0] : ey < 0 ? (tall ? IRON[4] : IRON[3]) : tall ? IRON[3] : IRON[2];
    }
    if (r > 0.76) return IRON[0];
    // the hub and its core
    if (r < 0.09) return power > 0.1 ? F[6] : lit > 0.99 ? EMBER[3] : IRON[1];
    if (r < 0.17) return r < 0.13 ? IRON[4] : IRON[0];
    // eight teal spokes
    for (let k = 0; k < 8; k++) {
      const ak = (k / 8) * TAU, off = Math.abs(Math.sin(ang - ak)) * r;
      if (Math.cos(ang - ak) > 0 && off < 0.055) return off < 0.02 ? TEAL[3] : ey < 0 ? TEAL[2] : TEAL[1];
    }
    // sectors packed with nozzles, lighting up one sector after another
    const sector = Math.floor(((ang + Math.PI) / TAU) * 8 + 0.5) % 8;
    const ring = Math.floor(r * 11), step = Math.floor(((ang + Math.PI) / TAU) * (14 + ring * 6));
    const cr = (ring + 0.5) / 11, ca = ((step + 0.5) / (14 + ring * 6)) * TAU - Math.PI;
    const dn = Math.hypot((r * Math.cos(ang) - cr * Math.cos(ca)) * rx, (r * Math.sin(ang) - cr * Math.sin(ca)) * ry);
    if (ring % 2 === 1 && dn < 1.3) {
      const on = lit > (sector + 1) / 9;
      return power > 0.2 ? (dn < 0.7 ? F[6] : F[4]) : on ? (dn < 0.7 ? EMBER[3] : EMBER[2]) : IRON[0];
    }
    return ey < 0 ? IRON[2] : IRON[1];
  });
  if (lit > 0.3 && power < 0.2) p.glow(fx, CY, ry * 0.9, EMBER[2], 0.3 * lit);
}

function engine(p, x0, t, power, ex, R) {
  const s1 = ease.outBack(seg(t, SLIDE[0], SLIDE[1]));
  if (s1 <= 0.01) return;
  const open = ease.outBack(seg(t, OPEN[0], OPEN[1])), lit = seg(t, LIGHTS[0], LIGHTS[1]);
  const fx = x0 - DRUM * s1, h = DRUM_H * (0.5 + 0.5 * Math.min(1, s1));
  // gold truss braces from the planet out along the drum
  const footX = (y) => ex - Math.sqrt(Math.max(0, (R + 4) ** 2 - (y - CY) ** 2));
  truss(p, footX(CY - h - 7), fx + 6, CY - h - 2, CY - h - 11);
  truss(p, footX(CY - h - 7), fx + 6, CY - h - 3, CY - h - 12);
  truss(p, footX(CY + h + 7), fx + 6, CY + h + 2, CY + h + 11);
  truss(p, footX(CY + h + 7), fx + 6, CY + h + 3, CY + h + 12);
  // the drum: armour plates with a crenellated edge
  for (let x = Math.floor(fx); x <= x0; x++) {
    const plate = Math.floor((x0 - x) / 6), lip = plate % 2 ? 2 : 0, seam = (x0 - x) % 6 === 0;
    for (let y = -h - lip; y <= h + lip; y++) {
      const v = y / h, edge = Math.abs(y) >= h + lip - 0.5;
      p.px(x, CY + y, edge ? IRON[0] : seam ? IRON[1] : shade(IRON, clamp(v, -1, 1)));
    }
  }
  // steam bleeding off the drum once the face is open
  if (open > 0.9) for (let i = 0; i < 8; i++) {
    const g = rng(55, i), age = ((t - OPEN[1]) * g.range(1, 1.8) + g.next()) % 1, x = lerp(fx, x0, g.next());
    p.disc(x + age * 8, CY - h - 6 - age * 30, 2 + age * 7, IRON[4], 0.4 * (1 - age));
  }
  face(p, fx, open, t, lit, power);
}

function mount(p, ex, R, t) {
  const s1 = ease.outBack(seg(t, SLIDE[0], SLIDE[1]));
  if (s1 <= 0.01) return;
  const h = DRUM_H * (0.5 + 0.5 * Math.min(1, s1)) + 16, reach = Math.asin(clamp(h / R, 0, 0.98)) * Math.min(1, s1);
  p.shade(ex - R - 3, CY - R, ex - R * 0.4, CY + R, (x, y, out) => {
    const dx = x - ex, dy = y - CY, r = Math.hypot(dx, dy), a = Math.atan2(dy, -dx);
    if (Math.abs(a) > reach || dx > 0) return 0;
    // shadow cast on the ground just inside the collar
    if (r < R - 3 && r > R - 11) { out.a = 0.5 * (1 - (R - 3 - r) / 8); return IRON[0]; }
    if (r < R - 3 || r > R + 7) return 0;
    const v = dy / R, edgeA = Math.abs(a) > reach - 0.03;
    if (r > R + 6 || r < R - 2 || edgeA) return IRON[0];
    if (r > R + 4.5) return v < 0 ? GOLD[3] : GOLD[1];
    const bolt = Math.round(a * R) % 6 === 0 && Math.abs(r - (R + 1.5)) < 0.8;
    return bolt ? IRON[5] : v < -0.3 ? IRON[4] : v < 0.3 ? IRON[3] : IRON[2];
  });
  // armoured shoulders filling the wedge between the drum and the collar, so one flows into the other
  const dh = DRUM_H * (0.5 + 0.5 * Math.min(1, s1)), sock = (y) => ex - Math.sqrt(Math.max(0, (R + 6) ** 2 - (y - CY) ** 2));
  for (const side of [-1, 1])
    for (let k = 0; k <= 18; k++) {
      const dy = dh - 6 + k, y = CY + side * dy, w = Math.round(lerp(22, 3, k / 18) * Math.min(1, s1)), xr = Math.floor(sock(y));
      for (let x = xr - w; x <= xr; x++) {
        const outer = k === 18 || x === xr - w, v = side * (dy / (dh + 14));
        let c = outer ? IRON[0] : v < -0.5 ? IRON[4] : v < 0 ? IRON[3] : v < 0.5 ? IRON[2] : IRON[1];
        if (!outer && x >= xr - 1) c = side < 0 ? GOLD[3] : GOLD[1];
        if (!outer && (xr - x) % 7 === 3 && k % 4 === 2) c = IRON[5];
        p.px(x, y, c);
      }
    }
  // gold feet where the trusses meet the collar
  for (const side of [-1, 1]) {
    const y = CY + side * (DRUM_H * (0.5 + 0.5 * Math.min(1, s1)) + 7), x = ex - Math.sqrt(Math.max(0, (R + 6) ** 2 - (y - CY) ** 2));
    p.rect(x - 2, y - 3, 6, 6, GOLD[1]);
    p.rect(x - 1, y - 2, 4, 2, GOLD[3]);
  }
}

const engineMouth = (x0, t) => x0 - DRUM * ease.outBack(seg(t, SLIDE[0], SLIDE[1]));

// the plume: it bursts out of the mouth into a huge rounded bulb, then draws out into a long sharp point
function plumeHalf(u, power) {
  const mouthH = 50, maxH = 96, bulb = 0.2;
  const h = u < bulb ? mouthH + (maxH - mouthH) * Math.sqrt(1 - Math.pow(1 - u / bulb, 2))
    : maxH * Math.cos(((u - bulb) / (1 - bulb)) * Math.PI / 2);
  return Math.max(1, h * power);
}

function jet(p, mouth, L, t, seed, power) {
  if (L < 2) return;
  const x0 = Math.max(0, Math.floor(mouth - L));
  for (let px = x0; px <= mouth; px++) {
    const u = (mouth - px) / L, half = plumeHalf(u, power);
    const wob = 1 + 0.015 * Math.sin(px * 0.08 - t * 30);
    for (let dy = -Math.ceil(half * wob); dy <= Math.ceil(half * wob); dy++) {
      const d = Math.abs(dy) / (half * wob), y = CY + dy, fade = 1 - u * 0.35;
      if (d < 0.16) p.px(px, y, F[6]);
      else if (d < 0.32) p.px(px, y, F[5]);
      else if (d < 0.6) p.blend(px, y, F[4], 0.85 * fade);
      else if (d < 0.85) p.blend(px, y, F[3], 0.6 * fade);
      else p.blend(px, y, F[2], 0.4 * fade * (1 - (d - 0.85) / 0.15));
    }
  }
  // thin streaks of light racing out along the plume
  for (let i = 0; i < 34; i++) {
    const g = rng(seed, i), age = (t * g.range(1.8, 3.2) + g.next()) % 1, side = g.range(-0.8, 0.8);
    const x = mouth - age * L, y = CY + side * plumeHalf(age, power);
    p.line(x, y, x - 12 - age * 16, y, age < 0.5 ? F[6] : F[5], 0.8 * (1 - age));
  }
  p.glow(mouth - L * 0.12, CY, 110 * power, F[4], 0.7);
  p.glowLine(mouth, CY, mouth - L, CY, 50 * power, F[3], 0.3);
  sparkle(p, mouth - 2, CY, 30 * power, F[6], F[4], 0.9);
}

function veil(p, k) {
  if (k <= 0) return;
  p.shade(0, 0, W, H, () => VEIL);
}

export function draw(p, t, o) {
  const fadeIn = seg(t, 0, 0.15), fadeOut = 1 - seg(t, 2.65, 2.8);
  if (fadeOut <= 0) return;
  // the backdrop dims the game behind the whole cut-in
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) p.blend(x, y, VEIL, 0.82 * fadeIn * fadeOut);

  // a hard shake right after ignition
  const kick = clamp(1 - (t - FLASH) / 0.4) * (t > FLASH ? 1 : 0);
  const sx = Math.round(Math.sin(t * 95) * 4 * kick), sy = Math.round(Math.cos(t * 77) * 3 * kick);

  at(p, sx, sy, () => {
    const inBand = seg(t, BAND[0], BAND[0] + 0.2);
    // the band arrives for the last act, on the planet's centre line
    if (t >= BAND[0]) at(p, 0, CY - 75, () => band(p, (t - BAND[0]) * 0.9 / (BAND[1] - BAND[0]), F[3], o.seed));

    const leave = ease.inCubic(seg(t, 2.45, 2.75));
    const R = lerp(lerp(30, 58, ease.outBack(seg(t, 0, 0.35))), 46, ease.inOutCubic(inBand));
    const ex = lerp(lerp(250, 290, ease.outCubic(inBand)), 560, leave), ey = CY;
    const x0 = ex - R + 8;
    const mouth = engineMouth(x0, t);

    // ignition: light streams into the mouth, then a white flash and a shockwave
    const charge = seg(t, CHARGE[0], CHARGE[1]);
    if (charge > 0 && t < FLASH) {
      for (let i = 0; i < 34; i++) {
        const g = rng(o.seed + 5, i), q = (charge * g.range(1, 2) + g.next()) % 1;
        const a = g.range(-1.2, 1.2) + Math.PI, r = (1 - q) * 120;
        const px = mouth + Math.cos(a) * r, py = ey + Math.sin(a) * r * 0.7;
        p.line(px, py, px + Math.cos(a) * 8, py + Math.sin(a) * 5, q > 0.7 ? F[6] : F[4], 0.8);
      }
      p.glow(mouth, ey, 10 + charge * 30, F[5], 0.4 + charge * 0.5);
    }
    const sinceFlash = t - FLASH;
    const power = t < FLASH ? 0 : Math.min(1, sinceFlash / 0.15) * (1 - leave);
    if (power > 0.05) jet(p, mouth, Math.max(60, power * mouth), t, o.seed, Math.max(0.3, power));
    engine(p, x0, t, power, ex, R);
    p.glow(ex, ey, R * 1.7, F[3], 0.25 + 0.2 * power);
    at(p, ex, ey, () => earthFx.draw(p, t * 3, { ...earthFx.meta.options, radius: R }));
    mount(p, ex, R, t);

    // the glint as the planet catches the light
    for (const gt of GLINT) {
      const k = seg(t, gt, gt + 0.22);
      if (k <= 0 || k >= 1) continue;
      const s = Math.sin(k * Math.PI);
      sparkle(p, ex - R * 0.5, ey - R * 0.62, 30 * s, F[6], hex("#9ed8f0"), 1);
      for (let i = 0; i < 200; i++) {
        const a = (i / 200) * TAU;
        p.blend(ex + Math.cos(a) * (R + 1), ey + Math.sin(a) * (R + 1), hex("#d8f4ff"), 0.8 * s);
      }
      p.glow(ex, ey, R * 2, hex("#9ed8f0"), 0.4 * s);
    }
    if (sinceFlash >= 0 && sinceFlash < 0.12) {
      const k = 1 - sinceFlash / 0.12;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) p.blend(x - sx, y - sy, F[6], 0.75 * k);
    }
    if (sinceFlash >= 0 && sinceFlash < 0.45) {
      const k = sinceFlash / 0.45, rr = 10 + k * 160;
      for (let i = 0; i < 220; i++) {
        const a = (i / 220) * TAU;
        p.dot(mouth + Math.cos(a) * rr, ey + Math.sin(a) * rr * 0.55, k < 0.4 ? F[6] : F[4], 1 - k);
      }
    }
  });
}
