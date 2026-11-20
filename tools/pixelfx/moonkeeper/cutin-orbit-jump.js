import { TAU, seg, clamp, hex, lerp, ease } from "../../core/index.js";
import { W, H, D, band, moon, timing, at } from "./_cutin.js";
import * as moonFx from "./moon.js";

export const meta = {
  name: "Cut-in: orbit jump", desc: "Skill cut-in: the band slams in and the moon blinks across it in three jumps, cyan afterimages and warp rings left behind.",
  tags: ["moonkeeper", "cutin", "one-shot"], size: [W, H], origin: [0, 0], duration: D, loop: false, fps: 12, bg: "dark",
  options: { seed: 14 },
};

const C = ["#14466e", "#2f9fd0", "#5fd4e0", "#bff6ff", "#ffffff"].map(hex);
// the moon blinks to these spots one after another
const SPOTS = [[-70, 0], [60, 0.08], [180, 0.28], [300, 0.48], [560, 0.74]];

function placeAt(t) {
  let x = SPOTS[0][0];
  for (const [sx, st] of SPOTS) if (t >= st) x = sx;
  return x;
}

function warp(p, x, y, age, R) {
  const k = clamp(age / 0.25);
  if (k >= 1) return;
  for (let i = 0; i < 70; i++) {
    const a = (i / 70) * TAU, rr = R * (0.6 + k * 0.8);
    p.dot(x + Math.cos(a) * rr * 0.5, y + Math.sin(a) * rr, k < 0.5 ? C[4] : C[2], 1 - k);
  }
}

export function draw(p, t, o) {
  const b = band(p, t, C[2], o.seed);
  if (!b) return;
  const y = 75, x = placeAt(t);
  // afterimages at every spot it has left, fading out
  for (let i = 1; i < SPOTS.length - 1; i++) {
    const [sx, st] = SPOTS[i], next = SPOTS[i + 1][1];
    if (t < next) continue;
    const age = t - next;
    warp(p, sx, y, age, 50);
    if (age < 0.3) {
      p.glow(sx, y, 50, C[2], 0.35 * (1 - age / 0.3));
      // afterimage: a translucent ghost fading out
      p.disc(sx, y, 44, C[2], 0.4 * (1 - age / 0.3));
      p.disc(sx - 6, y - 6, 30, C[3], 0.2 * (1 - age / 0.3));
    }
  }
  // streaks between jumps
  for (let i = 1; i < SPOTS.length - 1; i++) {
    const [sx, st] = SPOTS[i], [nx, nt] = SPOTS[i + 1];
    const age = t - nt;
    if (age < 0 || age > 0.15) continue;
    for (let j = -3; j <= 3; j++) p.line(sx + 30, y + j * 10, Math.min(nx - 30, W), y + j * 10, C[3], 0.6 * (1 - age / 0.15));
  }
  if (x > -60 && x < W + 60) {
    const sinceJump = t - SPOTS.find(([sx]) => sx === x)[1];
    warp(p, x, y, sinceJump, 50);
    moon(p, t, x, y, 44, C[2]);
  }
}
