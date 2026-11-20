import { TAU, seg, clamp, hex, lerp, ease, rng, rand, sparkle } from "../../core/index.js";
import { W, H, CY, D, IRON, BRASS, tone, sequence, limb } from "./_longcut.js";

export const meta = {
  name: "Cut-in: laser cannon, long",
  desc: "Long skill cut-in: hatches slide open on the moon's right side, a domed turret rises, twin rails run out with heat-sink fins, brass-capped capacitors light one by one, arcs crackle between the rails and a screen-piercing laser fires right.",
  tags: ["moonkeeper", "cutin", "one-shot"], size: [W, H], origin: [0, 0], duration: D, loop: false, fps: 12, bg: "dark",
  options: { seed: 41 },
};

const F = ["#0a2a3a", "#14466e", "#2f9fd0", "#5fd4e0", "#9ff0ff", "#d8fbff", "#ffffff"].map(hex);
const COPPER = ["#3a160c", "#7a3418", "#b85a2c", "#e88a50"].map(hex);
const HATCH = [0.45, 0.62], DOME = [0.55, 0.82], RAILS = [0.8, 1.1], CAPS = [0.95, 1.12], LIGHT = [1.1, 1.32];
const RAIL_LEN = 128, RAIL_Y = 13, RAIL_T = 4, DOME_R = 26;

const railLen = (t) => RAIL_LEN * ease.outBack(seg(t, RAILS[0], RAILS[1]));

function hatch(p, k) {
  const o = ease.outCubic(seg(k.t, HATCH[0], HATCH[1])), x = Math.round(limb(k.ex, k.R, CY)) - 10;
  if (o <= 0 || k.t > DOME[0] + 0.12) return;
  // the opening in the moon and two plates sliding away from it
  p.rect(x, CY - 20 * o, 10, 40 * o, IRON[0]);
  for (const side of [-1, 1]) {
    const y = CY + side * (8 + 20 * o);
    p.rect(x - 1, side < 0 ? y - 10 : y, 12, 10, IRON[3]);
    p.rect(x - 1, side < 0 ? y - 10 : y + 9, 12, 1, IRON[0]);
    p.rect(x - 1, side < 0 ? y - 10 : y, 12, 1, IRON[5]);
  }
}

// where the turret meets the moon: a curved base plate hugging the moon, thickest under the dome and
// tapering to nothing at its ends, a gold lip on its outer edge, rivets, and a contact shadow inside it
function mount(p, k) {
  const e = ease.outBack(seg(k.t, DOME[0], DOME[1]));
  if (e <= 0.01) return;
  const { ex, R } = k, grow = Math.min(1, e), h = (DOME_R + 26) * grow, reach = Math.asin(clamp(h / R, 0, 0.98));
  p.shade(ex + R * 0.3, CY - R, ex + R + 20, CY + R, (x, y, out) => {
    const dx = x - ex, dy = y - CY, r = Math.hypot(dx, dy), a = Math.atan2(dy, dx);
    if (Math.abs(a) > reach || dx < 0) return 0;
    const u = Math.abs(a) / reach, outerR = R + 2 + 14 * grow * Math.cos(u * Math.PI / 2);
    if (r < R - 3 && r > R - 11) { out.a = 0.5 * (1 - (R - 3 - r) / 8) * (1 - u); return IRON[0]; }
    if (r < R - 3 || r > outerR) return 0;
    if (r > outerR - 1 || r < R - 2) return IRON[0];
    if (r > outerR - 3) return dy < 0 ? BRASS[4] : BRASS[2];
    const bolt = Math.round(a * R) % 6 === 0 && Math.abs(r - (R + 2)) < 0.8;
    if (bolt) return IRON[5];
    const v = dy / R;
    return v < -0.3 ? IRON[4] : v < 0.3 ? IRON[3] : IRON[2];
  });
}

function dome(p, k) {
  const e = ease.outBack(seg(k.t, DOME[0], DOME[1]));
  if (e <= 0.01) return;
  const cx = k.x0 - 4, r = DOME_R * Math.min(1.08, e);
  p.shade(cx, CY - r - 1, cx + r + 1, CY + r + 1, (x, y) => {
    const dx = x - cx, dy = y - CY, d = Math.hypot(dx, dy);
    if (dx < 0 || d > r) return 0;
    if (d > r - 1) return IRON[0];
    if (d > r - 4) return dy < 0 ? BRASS[4] : BRASS[2];
    // rivets round the brass ring and a cyan eye slit
    if (Math.abs(d - (r - 6)) < 0.6 && Math.round(Math.atan2(dy, dx) * 6) % 2 === 0) return IRON[5];
    if (Math.abs(dy) < 2 && dx > r * 0.35 && dx < r * 0.8) return seg(k.t, LIGHT[0], LIGHT[1]) > 0 ? F[5] : IRON[0];
    return tone(IRON, dy / r);
  });
}

function rails(p, k) {
  const L = railLen(k.t);
  if (L < 1) return;
  const x0 = k.x0 + 14, lit = seg(k.t, LIGHT[0], LIGHT[1]);
  for (const side of [-1, 1]) {
    for (let x = Math.floor(x0); x <= x0 + L; x++) {
      for (let j = -RAIL_T; j <= RAIL_T; j++) {
        const y = CY + side * RAIL_Y + j, edge = Math.abs(j) === RAIL_T;
        p.px(x, y, edge ? IRON[0] : tone(IRON, j / RAIL_T));
      }
      // heat-sink fins on the outer face
      if ((x - x0) % 4 < 2) for (let j = 1; j <= 3; j++) p.px(x, CY + side * (RAIL_Y + RAIL_T + j), j === 3 ? IRON[0] : IRON[2]);
      // the inner face glows as the rails charge
      if (lit > (x - x0) / L) p.px(x, CY + side * (RAIL_Y - RAIL_T), F[4]);
    }
    // brass caps at the tips
    for (let j = -RAIL_T - 2; j <= RAIL_T + 2; j++) for (let q = 0; q < 3; q++) p.px(x0 + L - q, CY + side * RAIL_Y + j, q === 1 ? BRASS[4] : BRASS[2]);
  }
  // arcs jumping between the rails while it charges and fires
  if (lit > 0.5) {
    const f = Math.floor(k.t * 12);
    for (let i = 0; i < 3; i++) {
      const r = rng(k.seed, f * 7 + i), x = x0 + r.range(0.1, 1) * L * lit;
      let px = x, py = CY - RAIL_Y + RAIL_T;
      for (let s = 0; s < 6; s++) {
        const ny = py + (2 * (RAIL_Y - RAIL_T)) / 6, nx = x + r.range(-4, 4);
        p.line(px, py, nx, ny, s % 2 ? F[6] : F[5]);
        px = nx; py = ny;
      }
      p.glow(x, CY, 8, F[4], 0.4);
    }
  }
}

function capacitors(p, k) {
  const e = ease.outBack(seg(k.t, CAPS[0], CAPS[1]));
  if (e <= 0.01) return;
  const L = railLen(k.t), x0 = k.x0 + 14, lit = seg(k.t, LIGHT[0], LIGHT[1]);
  for (let i = 0; i < 4; i++) {
    const cx = Math.round(x0 + L * (0.18 + i * 0.2)), h = Math.round(13 * e), top = CY - RAIL_Y - RAIL_T - h, on = lit > (i + 1) / 5;
    // copper cable looping back to the turret
    p.line(cx - 2, top + h, k.x0 + 8, CY - 8, COPPER[2]);
    for (let y = top; y < top + h; y++)
      for (let x = cx - 4; x <= cx + 4; x++) {
        const edge = x === cx - 4 || x === cx + 4, cap = y < top + 3 || y > top + h - 3;
        p.px(x, y, edge ? BRASS[0] : cap ? (x < cx ? BRASS[4] : BRASS[2]) : on ? (x === cx - 1 ? F[6] : F[4]) : IRON[1]);
      }
    if (on) p.glow(cx, top + h / 2, 8, F[4], 0.4);
  }
}

function shot(p, k, mouth) {
  const power = Math.max(0.3, k.power);
  if (k.power < 0.05) return;
  const end = W + k.camX;
  for (let px = Math.floor(mouth); px < end; px++) {
    const u = (px - mouth) / Math.max(1, end - mouth), ripple = 1 + 0.12 * Math.sin(px * 0.25 + k.t * 60);
    const core = 7 * power * ripple, sheath = 15 * power, haze = 28 * power;
    for (let dy = -Math.ceil(haze); dy <= Math.ceil(haze); dy++) {
      const d = Math.abs(dy), y = CY + dy;
      if (d < core * 0.5) p.px(px, y, F[6]);
      else if (d < core) p.px(px, y, F[5]);
      else if (d < sheath) p.blend(px, y, F[4], 0.8 * (1 - u * 0.3));
      else p.blend(px, y, F[3], 0.35 * (1 - (d - sheath) / (haze - sheath)));
    }
  }
  for (let i = 0; i < 5; i++) {
    const q = (k.t * 2.2 + i / 5) % 1, x = mouth + q * (end - mouth);
    for (let j = 0; j < 40; j++) { const a = (j / 40) * TAU; p.blend(x + Math.cos(a) * 4, CY + Math.sin(a) * 22 * power, F[5], 0.8 * (1 - q)); }
  }
  for (let i = 0; i < 24; i++) {
    const g = rng(k.seed, i), age = (k.t * g.range(2, 3.5) + g.next()) % 1, x = mouth + age * (end - mouth), y = CY + g.range(-1, 1) * 18 * power;
    p.line(x, y, x + 14, y, F[6], 0.8 * (1 - age));
  }
  p.glowLine(mouth, CY, end, CY, 40 * power, F[3], 0.4);
  p.glow(mouth, CY, 60 * power, F[4], 0.8);
  sparkle(p, mouth + 2, CY, 34 * power, F[6], F[4], 1);
}

export function draw(p, t, o) {
  sequence(p, t, o, F, {
    mouth: (k) => k.x0 + 14 + railLen(t),
    follow: (k, mouth) => mouth + 260 * seg(k.t, 1.6, 2.4),
    shot,
    draw(p, k) { hatch(p, k); mount(p, k); rails(p, k); capacitors(p, k); dome(p, k); },
  });
}
