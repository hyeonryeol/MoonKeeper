import { TAU, seg, clamp, hex, lerp, ease, rng, sparkle } from "../../core/index.js";
import { W, H, CY, D, IRON, BRASS, tone, sequence, limb } from "./_longcut.js";

export const meta = {
  name: "Cut-in: gravity cannon, long",
  desc: "Long skill cut-in: two jointed brass arms unfold from the moon's right side holding three great rings, the rings spin up like a gyroscope around a forming black singularity, then it fires a gravity bomb right that halts and swells into a devouring vortex.",
  tags: ["moonkeeper", "cutin", "one-shot"], size: [W, H], origin: [0, 0], duration: D, loop: false, fps: 12, bg: "dark",
  options: { seed: 43 },
};

const F = ["#120a26", "#2a1650", "#4a2a8a", "#7a4ad0", "#b48cf5", "#e4d4ff", "#ffffff"].map(hex);
const ARMS = [0.5, 0.85], RINGS = [0.8, 1.1], SPIN = [1.05, 1.6];
const REACH = 72, RING_R = 38;

const reach = (t) => ease.outBack(seg(t, ARMS[0], ARMS[1]));
const centre = (k) => k.x0 + 8 + REACH * reach(k.t);

function arm(p, ax, ay, bx, by, side, e) {
  // two brass segments with an elbow that kicks outward, iron joints and a piston along the forearm
  const mx = lerp(ax, bx, 0.45), my = lerp(ay, by, 0.45) + side * 16 * e;
  for (const [x0, y0, x1, y1] of [[ax, ay, mx, my], [mx, my, bx, by]]) {
    for (let w = -2; w <= 2; w++) p.line(x0, y0 + w, x1, y1 + w, Math.abs(w) === 2 ? BRASS[0] : w < 0 ? BRASS[4] : BRASS[2]);
  }
  p.line(lerp(mx, bx, 0.2), lerp(my, by, 0.2) - side * 4, lerp(mx, bx, 0.8), lerp(my, by, 0.8) - side * 4, IRON[4]);
  for (const [x, y, r] of [[ax, ay, 4], [mx, my, 4], [bx, by, 3]]) {
    p.circle(x, y, r, IRON[0]);
    p.circle(x, y, r - 1, IRON[3]);
    p.px(x - 1, y - 1, IRON[5]);
  }
}

function ring(p, cx, r, phase, kind, k, front) {
  // a ring seen in 3D: it turns about a vertical, horizontal or diagonal axis
  const n = Math.ceil(r * 8), lit = seg(k.t, SPIN[0], SPIN[1]);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    let x = Math.cos(a) * r, y = Math.sin(a) * r, z = 0;
    if (kind === 0) { z = x * Math.sin(phase); x *= Math.cos(phase); }
    else if (kind === 1) { z = y * Math.sin(phase); y *= Math.cos(phase); }
    else { const c = Math.cos(phase), s = Math.sin(phase), u = (x + y) / Math.SQRT2, v = (x - y) / Math.SQRT2; z = u * s; const u2 = u * c; x = (u2 + v) / Math.SQRT2; y = (u2 - v) / Math.SQRT2; }
    if ((z >= 0) !== front) continue;
    const px = cx + x, py = CY + y, rune = i % Math.max(4, Math.floor(n / 12)) === 0;
    for (let w = -1; w <= 1; w++) {
      const c = rune && w === 0 && lit > 0.1 ? F[5] : front ? (w < 0 ? BRASS[4] : w > 0 ? BRASS[1] : BRASS[3]) : (w < 0 ? IRON[3] : IRON[1]);
      p.px(px, py + w, c);
    }
    if (rune && lit > 0.1 && front) p.light(px, py, F[4], 0.5 * lit);
  }
}

function core(p, cx, k) {
  const g = seg(k.t, 1.0, 1.6), r = 2 + 10 * g;
  if (g <= 0) return;
  // gravity bending the light round the forming singularity
  for (let j = 0; j < 3; j++) {
    const rr = r + 4 + j * 5 + Math.sin(k.t * 20 + j) * 1.5;
    for (let i = 0; i < 60; i++) { const a = (i / 60) * TAU; p.blend(cx + Math.cos(a) * rr, CY + Math.sin(a) * rr, F[4], 0.35 * (1 - j / 3) * g); }
  }
  p.disc(cx, CY, r, F[0], 0.97);
  for (let i = 0; i < 40; i++) { const a = (i / 40) * TAU; p.px(cx + Math.cos(a) * r, CY + Math.sin(a) * r, i % 3 ? F[4] : F[6]); }
  p.glow(cx, CY, 20 + 30 * g, F[3], 0.5);
}

function rings(p, k, front) {
  const e = ease.outBack(seg(k.t, RINGS[0], RINGS[1]));
  if (e <= 0.01) return;
  const cx = centre(k), r = RING_R * Math.min(1.06, e), spin = 1 + 14 * seg(k.t, SPIN[0], SPIN[1]) ** 2;
  const ph = k.t * spin;
  ring(p, cx, r, ph, 0, k, front);
  ring(p, cx, r * 0.82, ph * 1.3 + 1, 1, k, front);
  ring(p, cx, r * 0.64, ph * 1.7 + 2, 2, k, front);
}

const bombX = (k, mouth) => lerp(mouth + 10, mouth + 300, ease.outCubic(seg(k.t, 1.6, 2.05)));

function shot(p, k, mouth) {
  const fly = ease.outCubic(seg(k.t, 1.6, 2.05)), fade = 1 - k.leave;
  const bx = bombX(k, mouth), grow = seg(k.t, 1.95, 2.35), s = Math.max(0.15, grow) * fade;
  if (fade <= 0.02) return;
  if (grow > 0) {
    for (let arm = 0; arm < 4; arm++)
      for (let i = 0; i < 70; i++) {
        const u = i / 70, r = (8 + u * 90) * s, a = arm * TAU / 4 + u * 5 - k.t * 9;
        p.px(bx + Math.cos(a) * r * 1.2, CY + Math.sin(a) * r * 0.8, u < 0.25 ? F[6] : u < 0.5 ? F[5] : u < 0.75 ? F[4] : F[3]);
      }
    for (let i = 0; i < 50; i++) {
      const g = rng(k.seed, i), q = (k.t * g.range(1.2, 2.2) + g.next()) % 1, a = g.range(0, TAU) + q * 3, r = (1 - q) * 110 * s;
      const px = bx + Math.cos(a) * r * 1.2, py = CY + Math.sin(a) * r * 0.8;
      p.line(px, py, px + Math.cos(a) * 5, py + Math.sin(a) * 4, F[5], 0.8);
    }
    p.glow(bx, CY, 110 * s, F[3], 0.6);
  }
  if (fly < 1) for (let i = 0; i < 4; i++) {
    const rx = lerp(mouth, bx, i / 4), rr = 6 + i * 3;
    for (let j = 0; j < 40; j++) { const a = (j / 40) * TAU; p.blend(rx + Math.cos(a) * rr * 0.4, CY + Math.sin(a) * rr, F[4], 0.4 * (1 - i / 4)); }
  }
  const R = 9 + grow * 5;
  p.disc(bx, CY, R, F[0], 0.97);
  for (let j = 0; j < 60; j++) { const a = (j / 60) * TAU; p.px(bx + Math.cos(a) * R, CY + Math.sin(a) * R, j % 3 ? F[4] : F[6]); }
  p.glow(bx, CY, 30 + 30 * grow, F[4], 0.7);
}

function mount(p, k) {
  const e = reach(k.t);
  if (e <= 0.01) return;
  const { ex, R } = k, grow = Math.min(1, e), h = 52 * grow, span = Math.asin(clamp(h / R, 0, 0.98));
  p.shade(ex + R * 0.2, CY - R, ex + R + 20, CY + R, (x, y, out) => {
    const dx = x - ex, dy = y - CY, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
    if (Math.abs(a) > span || dx < 0) return 0;
    const u = Math.abs(a) / span, outerR = R + 2 + 12 * grow * Math.cos(u * Math.PI / 2);
    if (r < R - 3 && r > R - 11) { out.a = 0.5 * (1 - (R - 3 - r) / 8) * (1 - u); return IRON[0]; }
    if (r < R - 3 || r > outerR) return 0;
    if (r > outerR - 1 || r < R - 2) return IRON[0];
    if (r > outerR - 3) return dy < 0 ? BRASS[4] : BRASS[2];
    if (Math.round(a * R) % 6 === 0 && Math.abs(r - (R + 2)) < 0.8) return IRON[5];
    const v = dy / R;
    return v < -0.3 ? IRON[4] : v < 0.3 ? IRON[3] : IRON[2];
  });
}

export function draw(p, t, o) {
  sequence(p, t, o, F, {
    mouth: (k) => centre(k),
    follow: (k, mouth) => (k.t < 1.6 ? mouth : bombX(k, mouth)),
    shot,
    behind(p, k) { rings(p, k, false); },
    draw(p, k) {
      const e = reach(k.t);
      if (e <= 0.01) return;
      const cx = centre(k);
      mount(p, k);
      for (const side of [-1, 1]) {
        const ay = CY + side * 30, ax = limb(k.ex, k.R + 8, ay);
        arm(p, ax, ay, cx, CY + side * RING_R * Math.min(1, e), side, e);
      }
      if (k.t < 1.6) core(p, cx, k);
      rings(p, k, true);
    },
  });
}
