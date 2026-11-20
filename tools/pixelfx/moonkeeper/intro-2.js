// Opening 2: the solar storm. A boiling sun fills the left, a flare loops up off its edge and erupts,
// a burning shock front tears across the screen and hits a big satellite in the foreground: arcs crawl
// over its panels, pieces fly off, its lamp goes red and dies and it tumbles away. The earth behind gets aurora.
import { TAU, clamp, seg, ease, lerp, hex, rng, fbm, mix } from "../../core/index.js";
import { at } from "./_cutin.js";
import * as earthFx from "./earth.js";
import { W, H, sky, finish, wash, satellite, arc, debris, shake, bay, WHITE } from "./_intro.js";

const D = 5.5, SX = -70, SY = 150, SR = 150;
const SUN = ["#5a0e0c", "#a8261a", "#e2421a", "#ff7a22", "#ffae35", "#ffd76a", "#fff3c4"].map(hex);
const ERUPT = 1.3, FRONT0 = 1.5, HIT = 2.9, EX = 330, EY = 92, ER = 34;
const ELEC = hex("#9fe7ff"), PANEL = ["#2f6fd0", "#4a5068", "#c9a24a", "#8a8494"].map(hex);

export const meta = {
  name: "Intro 2: solar storm", desc: "Opening scene: a boiling sun erupts, a burning shock front sweeps across and fries a big satellite in the foreground while the earth lights up with aurora.",
  tags: ["moonkeeper", "intro", "one-shot"], size: [W, H], origin: [0, 0], duration: D, loop: false, fps: 20, bg: "dark",
  options: { seed: 42 },
};

// where the shock front is at time t, and its curve
const frontX = (t) => lerp(SX + SR - 10, W + 80, ease.inOutSine(seg(t, FRONT0, 3.9)));
const curve = (y) => ((y - SY) ** 2) / 700;

export function draw(p, t, o) {
  const hitAge = t - HIT;
  const [sx, sy] = shake(t, t > ERUPT && t < ERUPT + 0.4 ? 2 : hitAge > 0 && hitAge < 0.7 ? 4 * (1 - hitAge / 0.7) + 1 : 0);
  sky(p, o.seed, t * 4 + sx, sy, { tint: ["#4a1d3a", "#2a2050"], warm: 0.4 });

  at(p, sx, sy, () => {
    // the earth far behind on the right
    p.glow(EX, EY, ER + 14, hex("#3a8bd6"), 0.3);
    at(p, EX, EY, () => earthFx.draw(p, 4 + t * 0.4, { ...earthFx.meta.options, radius: ER }));
    const fxNow = frontX(t), earthHit = fxNow - curve(EY) > EX - ER ? t : 0;
    const aur = earthHit ? clamp(1 - Math.max(0, t - (FRONT0 + 1.4)) / 2) : 0;
    if (aur > 0) {
      p.glowRing(EX, EY, ER + 3, 4, hex("#7dff9a"), 0.7 * aur * (0.7 + 0.3 * Math.sin(t * 17)));
      p.glowRing(EX, EY, ER + 7, 4, hex("#c36bff"), 0.45 * aur);
    }

    // the sun: boiling granules, darker toward the limb, a corona glow
    const swell = ease.outCubic(seg(t, 0, ERUPT)) * 6;
    p.glow(SX, SY, SR + 70, SUN[3], 0.45);
    p.shade(0, 0, SX + SR + 20, H, (x, y, out) => {
      const d = Math.hypot(x - SX, y - SY), r = SR + swell + fbm(y / 9, t * 2, o.seed, 2) * 3;
      if (d > r) return 0;
      const limb = d / r, g = fbm(x / 7 + t * 0.8, y / 7 - t * 0.5, o.seed + 3, 3);
      const v = 1 - limb * limb * 0.75 + g * 0.35 + bay(x, y) * 0.12;
      out.k = 0.15; out.l = SUN[4];
      return SUN[clamp(Math.floor(v * 6.4), 1, 6)];
    });
    // the flare: a magnetic loop rising off the edge, then snapping outward
    const loopK = ease.outCubic(seg(t, 0.2, ERUPT)), snap = seg(t, ERUPT, ERUPT + 0.6);
    for (let k = 0; k < 4; k++) {
      const h = (26 + k * 8) * loopK * (1 + snap * 3), a0 = -0.35, a1 = 0.15;
      const ax = SX + Math.cos(a0) * SR, ay = SY + Math.sin(a0) * SR, bx = SX + Math.cos(a1) * SR, by = SY + Math.sin(a1) * SR;
      const mx = (ax + bx) / 2 + h, my = (ay + by) / 2;
      let px = ax, py = ay;
      for (let i = 1; i <= 16; i++) {
        const f = i / 16, qx = (1 - f) ** 2 * ax + 2 * f * (1 - f) * mx + f * f * bx, qy = (1 - f) ** 2 * ay + 2 * f * (1 - f) * my + f * f * by;
        p.line(px, py, qx, qy, SUN[5 - (k & 1)], (1 - snap) * 0.9);
        px = qx; py = qy;
      }
      if (loopK > 0) p.glow(mx, my, 12, SUN[4], 0.3 * (1 - snap));
    }
    // flash at the eruption
    const f0 = clamp(1 - Math.abs(t - ERUPT - 0.05) / 0.15);
    if (f0 > 0) wash(p, SUN[6], 0.55 * f0);

    // the shock front: a white edge, a band of fire, burning streaks trailing behind it
    if (t > FRONT0) {
      const F = frontX(t);
      p.shade(0, 0, W, H, (x, y, out) => {
        const d = F - curve(y) - x + fbm(y / 10, t * 3, o.seed + 5, 3) * 8;
        if (d < 0 || d > 90) return 0;
        out.k = 0.35 * (1 - d / 90); out.l = SUN[4];
        if (d < 2.5) return SUN[6];
        if (d < 6) return SUN[5];
        if (d < 14) return SUN[4];
        // a translucent burning wash that thins out behind the front
        const fade = (d - 14) / 76, n = fbm(x / 7 - t * 20, y / 5, o.seed + 8, 3);
        const a = clamp((1 - fade) * 0.75 + n * 0.3);
        if (a > 0.02) p.blend(x, y, SUN[clamp(Math.floor(4.6 - fade * 2.5 + n * 1.5), 2, 5)], a);
        return 0;
      });
      // plasma streaks riding the wave
      for (let i = 0; i < 40; i++) {
        const g = rng(o.seed + 11, i), y = g.range(25, H - 25), x = F - curve(y) - g.range(0, 70), len = g.range(10, 30);
        if (x < 0) continue;
        p.line(x - len, y, x, y, g.chance(0.3) ? SUN[6] : SUN[4], 0.6);
      }
    }

    // the big satellite in the foreground
    const bx0 = 250, by0 = 178, dead = hitAge > 0;
    const drift = dead ? ease.outCubic(seg(hitAge, 0, 2.5)) : 0;
    const bx = bx0 + drift * 60, by = by0 + drift * 30, ang = -0.25 + (dead ? hitAge * 1.6 : Math.sin(t) * 0.04);
    const state = !dead ? 1 : hitAge < 0.9 ? 0.5 : 0;
    satellite(p, bx, by, ang, state, t, 3, 3.4, dead ? clamp(hitAge * 1.5) : 0);
    if (dead && hitAge < 1.4) {
      // electricity crawling over the panels
      for (let j = 0; j < 3; j++) {
        const side = j % 2 ? 1 : -1, c = Math.cos(ang), s = Math.sin(ang);
        const ax = bx + c * side * 18 * 1.0, ay = by + s * side * 18;
        const ex2 = bx + c * side * 55 + (j - 1) * 6, ey2 = by + s * side * 55 + (j - 1) * 9;
        arc(p, ax, ay, ex2, ey2, t + j * 0.3, o.seed + 40 + j, ELEC, 1 - hitAge / 1.4);
      }
      p.glow(bx, by, 40, ELEC, 0.5 * clamp(1 - hitAge / 0.6));
    }
    debris(p, bx, by, hitAge, 26, o.seed + 60, 160, PANEL);
    // a flash of white on contact
    const f1 = clamp(1 - Math.abs(hitAge) / 0.1);
    if (f1 > 0 && hitAge > -0.05) wash(p, WHITE, 0.6 * f1);
  });

  finish(p, t, D, 0.3, 0.5);
}
