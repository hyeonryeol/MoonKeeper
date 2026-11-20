// Ending: the giant rock is gone. We open on its pieces flying apart, their magma cracks cooling to black,
// the camera tilts down to the earth, whole and blue, the sun rises over its edge and floods the frame with
// light, and the little armed moon glides across in front, still on watch.
import { TAU, clamp, seg, ease, lerp, hex, rng } from "../../core/index.js";
import { at } from "./_cutin.js";
import * as earthFx from "./earth.js";
import * as moonFx from "./moon.js";
import * as bossFx from "./asteroid-boss.js";
import { W, H, sky, finish, wash, puffs, debris, shake, box, WHITE } from "./_intro.js";

const D = 7.2, EX = 200, EYW = 480, ER = 195, PAN = 175;
const SUN = ["#ff8a2a", "#ffc23d", "#ffe27a", "#fff3c4"].map(hex), SKYB = hex("#8fd0ff"), CYAN = hex("#6ff0ff");
const HOT = ["#a8261a", "#f2561d", "#ffae35", "#ffe27a"].map(hex), ASH = ["#2b2433", "#4a3d48", "#6e5a58"].map(hex);
const M = ["#0c0d1a", "#2e2d44", "#4a4658", "#77707a", "#cbbf9f"].map(hex);
const COLD = ["#0a080e", "#17121a", "#261c24", "#38282c", "#4c3634", "#614640"], DEAD = ["#17121a", "#261c24", "#38282c", "#261c24", "#17121a"];
// the pieces: direction, speed, size, when they go cold
const CHUNKS = [[-2.6, 34, 30, 1.6], [-0.5, 40, 24, 1.2], [0.6, 28, 34, 2.0], [2.2, 36, 20, 1.0], [-1.5, 46, 16, 0.8], [1.5, 30, 22, 1.4], [3.0, 44, 14, 0.9]];

export const meta = {
  name: "Ending: dawn", desc: "Ending scene: the boss's pieces drift apart and cool, the camera tilts down to the earth, the sun rises over its edge and the armed moon glides past on watch.",
  tags: ["moonkeeper", "ending", "one-shot"], size: [W, H], origin: [0, 0], duration: D, loop: false, fps: 20, bg: "dark",
  options: { seed: 51 },
};

export function draw(p, t, o) {
  const pan = ease.inOutCubic(seg(t, 1.3, 3.8)), oy = -PAN * pan;
  const [sx, sy] = shake(t, t < 0.6 ? 4 * (1 - t / 0.6) : 0);
  const dawn = ease.inOutSine(seg(t, 3.2, 5.8));
  sky(p, o.seed, sx, -oy * 0.5 + sy, { k: 1 - dawn * 0.4 });

  at(p, sx, sy + oy, () => {
    // the pieces of the giant, flying apart from where it died, cooling one by one
    const cx = 200, cy = 125;
    p.glow(cx, cy, 120, HOT[1], 0.35 * clamp(1 - t / 1.5));
    puffs(p, cx, cy, t, 22, o.seed + 3, 120, 10, 3.2);
    for (let i = 0; i < CHUNKS.length; i++) {
      const [a, sp, r, cold] = CHUNKS[i], d = 14 + sp * 1.7 * (t + 0.3) * (1 - t * 0.03);
      const x = cx + Math.cos(a) * d, y = cy + Math.sin(a) * d * 0.8;
      const k = seg(t, cold, cold + 1.2);
      const opts = { ...bossFx.meta.options, radius: r, seed: 21 + i * 3 };
      if (k >= 1) { opts.palette = COLD; opts.magma = DEAD; }
      else if (k > 0.5) opts.magma = ["#2a0e0c", "#5a1612", "#8a2a16", "#a8461e", "#c06a2a"];
      at(p, x, y, () => bossFx.draw(p, 1 + t * 0.6 + i, opts));
    }
    debris(p, cx, cy, t, 50, o.seed + 9, 150, [HOT[2], HOT[1], ASH[2], HOT[3], ASH[1]]);
    // embers still drifting out
    for (let i = 0; i < 40; i++) {
      const g = rng(o.seed + 5, i), a = g.range(0, TAU), d = g.range(20, 60) + t * g.range(10, 40);
      const life = g.range(1.5, 3.5);
      if (t > life) continue;
      p.px(cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.8, t / life > 0.6 ? HOT[0] : HOT[2]);
    }

    // the sun coming up behind the earth's upper left edge
    const sa = -2.25, sunx = EX + Math.cos(sa) * (ER - 6), suny = EYW + Math.sin(sa) * (ER - 6);
    if (dawn > 0) {
      p.glow(sunx, suny, 60 + 120 * dawn, SUN[1], 0.5 * dawn);
      p.glow(sunx, suny, 30 + 40 * dawn, SUN[3], 0.8 * dawn);
      p.disc(sunx, suny, 6 + 12 * dawn, SUN[3], 1);
      // rays
      for (let i = 0; i < 14; i++) {
        const g = rng(o.seed + 13, i), a = sa + g.range(-1.5, 1.5), len = g.range(60, 190) * dawn * (0.8 + 0.2 * Math.sin(t * 2 + i));
        p.glowLine(sunx, suny, sunx + Math.cos(a) * len, suny + Math.sin(a) * len, 3, SUN[2], 0.14 * dawn);
      }
    }
    // the earth, whole
    p.glow(EX, EYW, ER + 30, hex("#3a8bd6"), 0.3 + 0.2 * dawn);
    at(p, EX, EYW, () => earthFx.draw(p, 12 + t * 0.3, { ...earthFx.meta.options, radius: ER }));
    // the lit rim of atmosphere, brightest by the sun
    p.arc(EX, EYW, ER + 1, 2, Math.PI * 1.1, Math.PI * 1.9, SKYB, 0.6 + 0.4 * dawn);
    if (dawn > 0) {
      p.arc(EX, EYW, ER + 2, 3, sa - 0.5 * dawn, sa + 0.5 * dawn, SUN[3], dawn);
      p.glowRing(EX, EYW, ER + 3, 8, SUN[2], 0.3 * dawn);
    }
  });

  // the moon on watch, gliding across in front
  const mk = ease.outCubic(seg(t, 3.6, 6.8));
  if (mk > 0) {
    const mx = lerp(440, 262, mk), my = lerp(84, 96, mk), MR = 22, aim = -2.4;
    p.glow(mx, my, MR + 10, hex("#fbf4dc"), 0.2);
    at(p, mx, my, () => moonFx.draw(p, t * 0.4, { ...moonFx.meta.options, radius: MR }));
    const ca = Math.cos(aim), sa2 = Math.sin(aim), gx = mx + ca * MR * 0.6, gy = my + sa2 * MR * 0.6;
    for (const off of [-2.6, 2.6]) box(p, gx - sa2 * off, gy + ca * off, aim, 18, 1.8, (u, v) => (u > 15 ? M[0] : v < 0 ? M[4] : M[3]));
    box(p, gx, gy, aim, 9, 5, (u, v) => (Math.abs(v) > 4.2 ? M[0] : Math.floor(u / 2) % 2 ? CYAN : M[2]));
    p.disc(mx + ca * MR * 0.5, my + sa2 * MR * 0.5, 6.5, M[0], 1);
    p.disc(mx + ca * MR * 0.5, my + sa2 * MR * 0.5, 5.2, (d, a) => (Math.sin(a + 0.8) < -0.2 ? M[4] : M[2]), 1);
    p.glow(mx + ca * MR * 0.5, my + sa2 * MR * 0.5, 9, CYAN, 0.4);
  }

  // a soft lens flare across the frame, and the whole picture warms
  if (dawn > 0) {
    for (const [f, r, c] of [[0.3, 9, SUN[1]], [0.5, 16, SKYB], [0.72, 6, SUN[2]], [0.9, 11, hex("#c36bff")]]) {
      const x = lerp(77, 330, f), y = lerp(150 + (1 - pan) * PAN, 60, f);
      p.disc(x, y, r, c, 0.13 * dawn);
    }
    wash(p, SUN[3], 0.07 * dawn);
  }
  // the flash it died in
  const f0 = clamp(1 - t / 0.35);
  if (f0 > 0) wash(p, WHITE, 0.85 * f0);

  finish(p, t, D, 0.05, 0.8);
}
