import { seg, clamp, hex, tileFbm, rng } from "../../core/index.js";
import { W, H, D, band, heroX, earth, timing, inside } from "./_cutin.js";

export const meta = {
  name: "Cut-in: earth thruster", desc: "Skill cut-in: the band slams in, the Earth bursts in and lights a colossal engine, a jet of fire roaring back across the band.",
  tags: ["moonkeeper", "cutin", "one-shot"], size: [W, H], origin: [0, 0], duration: D, loop: false, fps: 12, bg: "dark",
  options: { seed: 12 },
};

const F = ["#4a1712", "#a8261a", "#f2561d", "#ff8a2a", "#ffc23d", "#ffe27a", "#ffffff"].map(hex);

export function draw(p, t, o) {
  const b = band(p, t, F[3], o.seed);
  if (!b) return;
  const x = heroX(t, 250), y = 75, { close } = timing(t);
  const fire = seg(t, 0.22, 0.32) * (1 - close * 0.6);
  if (fire > 0) {
    const nozzle = x - 44, L = (nozzle + 20) * fire;
    p.shade(0, 22, nozzle, 128, (px, py, out) => {
      if (!inside(b, px, py)) return 0;
      const u = (nozzle - px) / Math.max(1, L);
      if (u < 0 || u > 1) return 0;
      const n = tileFbm(px / 10 + t * 30, py / 6, 0, 0, o.seed, 3);
      const half = 10 + u * 34 + n * 8 * u, d = Math.abs(py - y) / half;
      if (d > 1) return 0;
      const heat = clamp((1 - d) * (1.1 - u * 0.9) + n * 0.25);
      if (heat < 0.08) return 0;
      out.k = 0.3 * heat; out.l = F[4];
      return F[clamp(Math.floor(heat * 7.4), 0, 6)];
    });
    for (let i = 0; i < 30; i++) {
      const g = rng(o.seed, i), age = (t * g.range(1.5, 3) + g.next()) % 1;
      const sx = nozzle - age * L * 1.1, sy = y + g.range(-1, 1) * (8 + age * 40);
      if (inside(b, sx, sy)) p.px(sx, sy, age < 0.4 ? F[6] : F[4]);
    }
    // the engine bell on the planet's back
    p.rect(nozzle - 6, y - 12, 10, 24, hex("#3a3f5c"));
    p.rect(nozzle - 8, y - 14, 4, 28, hex("#6b7394"));
    p.rect(nozzle - 9, y - 14, 1, 28, hex("#14162b"));
    p.glow(nozzle - 8, y, 40 * fire, F[5], 0.7);
  }
  earth(p, t, x, y, 44, F[3]);
}
