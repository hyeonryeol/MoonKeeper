import { rng, bolt, forks, fit, clamp } from "../../core/index.js";

export const meta = {
  name: "Chain lightning", desc: "A bolt leaps right from the coil to a target 60 px away, re-striking twice with a new path each time.",
  tags: ["moonkeeper", "lightning", "one-shot"], size: [72, 36], origin: [4, 18], duration: 0.4, loop: false, fps: 12, bg: "dark",
  options: { palette: ["#172a78", "#3f8cff", "#7cc8ff", "#c8f0ff", "#ffffff"], seed: 2, length: 62 },
};

export function draw(p, t, o) {
  const C = fit(o.palette, 5), L = o.length, f = Math.floor(t * 12), fade = clamp(1 - t / meta.duration);
  if (fade <= 0) return;
  const r = rng(o.seed, f), path = bolt(r, 0, 0, L, 0, { jag: 0.28, depth: 5 });
  for (const br of forks(r, path, { count: 2, len: 9, jag: 0.4 })) p.polyline(br, C[2], 0.8 * fade);
  p.polyline(path.map(([x, y]) => [x, y + 1]), C[1], fade);
  p.polyline(path, f % 2 ? C[3] : C[4]);
  p.glowLine(0, 0, L, 0, 7, C[2], 0.5 * fade);
  p.glow(0, 0, 6, C[3], 0.6 * fade);
  p.glow(L, 0, 8, C[3], 0.7 * fade);
}
