// Opening 4: the first strike. The earth fills the bottom of the frame. A meteor burns in from the top left,
// hits with a white flash, a fireball swells, a shock ring races over the ground, the land is left scorched
// and glowing, smoke climbs. Two more land after it.
import { TAU, clamp, seg, ease, lerp, hex, rng, fbm, fit } from "../../core/index.js";
import { at } from "./_cutin.js";
import * as earthFx from "./earth.js";
import { rock } from "./_lib.js";
import { W, H, sky, finish, wash, jet, puffs, debris, shake, bay, WHITE } from "./_intro.js";

const D = 4.8, EX = 200, EY = 425, ER = 232;
const FIRE = ["#4a1712", "#a8261a", "#f2561d", "#ff8a2a", "#ffc23d", "#ffe27a", "#ffffff"].map(hex);
const ROCK = ["#151320", "#2b2433", "#4a3d48", "#6e5a58", "#94786a", "#b89a82"].map(hex);
const INKC = hex("#07060c"), WARN = hex("#ff4a3a");
// each strike: where it lands, when, how big, where it comes from
const HITS = [[232, 1.6, 1, -60, -20], [118, 2.75, 0.6, -90, 60], [322, 3.35, 0.7, 140, -60]];

export const meta = {
  name: "Intro 4: the first strike", desc: "Opening scene: a meteor burns down onto the earth, a fireball and a shock ring spread over the ground, two more follow.",
  tags: ["moonkeeper", "intro", "one-shot"], size: [W, H], origin: [0, 0], duration: D, loop: false, fps: 20, bg: "dark",
  options: { seed: 45 },
};

const top = (x) => EY - Math.sqrt(Math.max(0, ER * ER - (x - EX) ** 2));

export function draw(p, t, o) {
  let kick = 0;
  for (const [, t0, sc] of HITS) { const a = t - t0; if (a > 0 && a < 0.9) kick = Math.max(kick, 6 * sc * (1 - a / 0.9)); }
  const [sx, sy] = shake(t, kick);
  sky(p, o.seed, t * 4 + sx, sy, { tint: ["#4a1d3a", "#2a2050"], warm: 1 });

  at(p, sx, sy, () => {
    // more rocks falling far behind
    for (let i = 0; i < 16; i++) {
      const g = rng(o.seed + 3, i), a = ((t * g.range(0.25, 0.5) + g.range(0, 1)) % 1);
      const x = lerp(g.range(-40, 300), g.range(60, 420), a), y = lerp(-10, 200, a * a);
      p.line(x - 10, y - 14 * (0.3 + a), x, y, FIRE[2], 0.5);
      p.px(x, y, FIRE[5]);
    }

    // the earth
    p.glow(EX, EY, ER + 30, hex("#3a8bd6"), 0.3);
    at(p, EX, EY, () => earthFx.draw(p, 9 + t * 0.3, { ...earthFx.meta.options, radius: ER }));
    p.arc(EX, EY, ER + 1, 2, Math.PI * 1.15, Math.PI * 1.85, hex("#8fd0ff"), 0.7);

    for (let h = 0; h < HITS.length; h++) {
      const [ix, t0, sc, fx0, fy0] = HITS[h], iy = top(ix) + 5, age = t - t0;
      // the meteor coming down
      const fall = seg(t, t0 - 1.0, t0);
      if (fall > 0 && age < 0) {
        const k = ease.inQuad(fall), x = lerp(fx0, ix, k), y = lerp(fy0, iy, k);
        const ang = Math.atan2(fy0 - iy, fx0 - ix);
        jet(p, x, y, ang, (40 + 60 * k) * sc, 9 * sc, t, o.seed + h);
        rock(p, x, y, 8 * sc, t * 5, fit(ROCK, 6), { seed: 20 + h, rough: 0.2, pits: 1 });
        p.glow(x, y, 18 * sc, FIRE[4], 0.6);
      }
      if (age < 0) continue;

      // the scorched ground: a dark flattened patch that grows, with cracks of ember light
      const grow = ease.outCubic(seg(age, 0, 1.2)), rx = 74 * sc * grow, ry = 17 * sc * grow;
      p.shade(ix - rx - 2, iy - ry - 2, ix + rx + 2, iy + ry * 2 + 2, (x, y, out) => {
        if (y < top(x) + 1) return 0;
        const d = Math.hypot((x - ix) / rx, (y - iy - ry * 0.4) / ry);
        if (d > 1) return 0;
        const n = fbm(x / 6, y / 4, o.seed + h * 7, 3), heat = (1 - d) * 1.2 + n * 0.6 - age * 0.18;
        if (heat > 0.75) { out.k = 0.5; out.l = FIRE[3]; return FIRE[clamp(Math.floor(heat * 4), 2, 5)]; }
        if (d + n * 0.3 + bay(x, y) * 0.3 > 0.85) return 0;
        return INKC;
      });

      // the shock ring racing outward over the ground
      const ring = seg(age, 0, 1.1);
      if (ring > 0 && ring < 1) {
        const R = 200 * sc * ease.outCubic(ring);
        for (let i = 0; i < 120; i++) {
          const a = (i / 120) * TAU, x = ix + Math.cos(a) * R, y = iy + Math.sin(a) * R * 0.22 + 4;
          if (y < top(x) + 1 || Math.hypot(x - EX, y - EY) > ER) continue;
          p.px(x, y, FIRE[6]); p.px(x, y + 1, FIRE[4]);
          p.light(x, y, FIRE[4], 0.5 * (1 - ring));
        }
      }

      // the fireball: a dome of fire that swells fast, then cools into smoke
      const R = 48 * sc * ease.outExpo(seg(age, 0, 0.55)), cool = seg(age, 0.35, 1.5);
      if (cool < 1)
        p.shade(ix - R - 4, iy - R - 4, ix + R + 4, iy + 6, (x, y, out) => {
          const d = Math.hypot(x - ix, (y - iy) * 1.1) / R;
          if (d > 1 || y > iy + 4) return 0;
          const n = fbm(x / 8, y / 8 - age * 4, o.seed + 9 + h, 3);
          const heat = (1 - d) * 1.5 + n * 0.5 - cool * 1.5;
          if (heat < 0.1) return 0;
          out.k = 0.5 * clamp(heat); out.l = FIRE[4];
          return FIRE[clamp(Math.floor(heat * 6.5 + bay(x, y) * 0.8), 0, 6)];
        });
      p.glow(ix, iy - 10, 90 * sc, FIRE[3], 0.6 * clamp(1 - age / 1.2));
      // a column of smoke, sparks and thrown rock
      puffs(p, ix, iy - 8, age - 0.3, Math.round(16 * sc), o.seed + 30 + h, 50 * sc, 70 * sc, 2.4);
      debris(p, ix, iy - 4, age, Math.round(30 * sc), o.seed + 50 + h, 190 * sc, [FIRE[5], FIRE[3], ROCK[3], FIRE[2]]);
      const f = clamp(1 - age / 0.14);
      if (f > 0) wash(p, WHITE, 0.75 * sc * f);
    }
    // the sky goes red
    const red = seg(t, HITS[0][1], HITS[0][1] + 1.5);
    p.glowRing(EX, EY, ER + 4, 10, WARN, 0.3 * red * (0.7 + 0.3 * Math.sin(t * 7)));
  });

  finish(p, t, D, 0.3, 0.5);
}
