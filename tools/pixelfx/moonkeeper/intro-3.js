// Opening 3: the swarm. With the shield dead, a river of rocks pours in from the top left toward the earth,
// thin far streaks at first, then fat tumbling boulders, and three huge ones roar right past the camera.
import { TAU, clamp, seg, ease, lerp, hex, rng, fit } from "../../core/index.js";
import { at } from "./_cutin.js";
import * as earthFx from "./earth.js";
import { rock } from "./_lib.js";
import { W, H, sky, finish, wash, shake } from "./_intro.js";

const D = 5.0, EX = 318, EY = 214, ER = 70;
const ROCK = ["#151320", "#2b2433", "#4a3d48", "#6e5a58", "#94786a", "#b89a82", "#d8bfa4"].map(hex);
const NEARC = ["#08070c", "#151320", "#241d2a", "#3a2f3a", "#584646", "#7a6058", "#9a7c68"].map(hex);
const HOT = ["#7a1414", "#f2561d", "#ffae35"].map(hex), WARN = hex("#ff4a3a");
// the three that pass the camera: start time, size, path
const NEAR = [[1.2, 46, -80, 40, 470, 250], [2.5, 64, -100, 180, 500, 60], [3.6, 54, 120, -90, 300, 420]];

export const meta = {
  name: "Intro 3: the swarm", desc: "Opening scene: a river of asteroids pours toward the earth, more and bigger every second, three huge ones roaring past the camera.",
  tags: ["moonkeeper", "intro", "one-shot"], size: [W, H], origin: [0, 0], duration: D, loop: false, fps: 20, bg: "dark",
  options: { seed: 43 },
};

export function draw(p, t, o) {
  // the camera shakes as each big one goes by
  let kick = 0;
  for (const [t0] of NEAR) { const a = t - t0 - 0.35; if (a > 0 && a < 0.5) kick = Math.max(kick, 4 * (1 - a / 0.5)); }
  const [sx, sy] = shake(t, kick);
  sky(p, o.seed, t * 10 + sx, t * 4 + sy, { tint: ["#3b2370", "#1f3a5e"], warm: seg(t, 0.5, 4) });

  at(p, sx, sy, () => {
    // the earth with a pulsing red warning on its rim
    p.glow(EX, EY, ER + 24, hex("#3a8bd6"), 0.3);
    at(p, EX, EY, () => earthFx.draw(p, 6 + t * 0.35, { ...earthFx.meta.options, radius: ER }));
    const w = seg(t, 1.0, 2.0) * (0.55 + 0.45 * Math.sin(t * 9));
    p.glowRing(EX, EY, ER + 3, 6, WARN, 0.35 * w);
    p.arc(EX, EY, ER + 1, 1, Math.PI * 0.95, Math.PI * 1.75, WARN, 0.6 * w);

    // the river: rocks from far (small, slow) to near (big, fast), each heating up as it falls in
    const C = fit(ROCK, 7);
    for (let i = 0; i < 70; i++) {
      const g = rng(o.seed, i);
      const start = g.range(-1, 3.8), life = g.range(1.6, 2.8), age = t - start;
      if (age < 0 || age > life) continue;
      const k = ease.inQuad(age / life), depth = g.range(0.3, 1);
      const x0 = g.range(-80, 200), y0 = g.range(-70, 40) - 40;
      const tx = EX + g.range(-150, 20), ty = EY + g.range(-110, 10);
      const x = lerp(x0, tx, k), y = lerp(y0, ty, k);
      const r = lerp(1, g.range(3, 12) * depth, k);
      const vx = tx - x0, vy = ty - y0, l = Math.hypot(vx, vy), ux = vx / l, uy = vy / l;
      // a hot trail behind it
      const tl = r * (2.5 + k * 3);
      for (let j = 0; j < 3; j++) p.line(x - ux * tl * (1 - j * 0.25), y - uy * tl * (1 - j * 0.25) + (j - 1) * r * 0.4, x, y, HOT[j], 0.25 + 0.2 * k);
      p.glow(x - ux * tl * 0.4, y - uy * tl * 0.4, r * 1.6, HOT[1], 0.15 * k);
      if (r < 2) p.px(x, y, C[4]);
      else rock(p, x, y, r, t * g.range(1, 3), C, { seed: 100 + i, rough: 0.22, pits: r > 6 ? 3 : 1 });
    }

    // the three giants passing the camera, motion blurred
    for (const [t0, R, x0, y0, x1, y1] of NEAR) {
      const a = (t - t0) / 0.8;
      if (a < 0 || a > 1) continue;
      const k = ease.inOutSine ? ease.inOutSine(a) : a, x = lerp(x0, x1, k), y = lerp(y0, y1, k);
      const ux = (x1 - x0), uy = (y1 - y0), l = Math.hypot(ux, uy);
      // speed streaks behind it instead of a ghost, it is close and in shadow
      for (let j = 0; j < 14; j++) {
        const g = rng(o.seed + 90 + R, j), off = g.range(-R * 0.9, R * 0.9), len = g.range(R * 1.2, R * 3);
        const nx = -uy / l, ny = ux / l, bx = x + nx * off, by = y + ny * off;
        p.line(bx - (ux / l) * len, by - (uy / l) * len, bx - (ux / l) * R * 0.5, by - (uy / l) * R * 0.5, j % 3 ? NEARC[3] : HOT[1], 0.5);
      }
      rock(p, x, y, R, t * 2, NEARC, { seed: 500 + R, rough: 0.2, pits: 5 });
      // the earth's blue light catching its night side
      p.arc(x, y, R * 1.02, 2, 0.1, 1.4, hex("#3a8bd6"), 0.55);
      p.glow(x + R * 0.5, y + R * 0.5, R * 0.6, hex("#3a8bd6"), 0.12);
      // a hot rim on its leading edge
      p.arc(x, y, R * 0.97, 2, Math.atan2(uy, ux) - 0.9, Math.atan2(uy, ux) + 0.9, HOT[1], 0.7);
      p.glow(x - (ux / l) * R, y - (uy / l) * R, R, HOT[1], 0.25);
    }
  });

  finish(p, t, D, 0.3, 0.5);
}
