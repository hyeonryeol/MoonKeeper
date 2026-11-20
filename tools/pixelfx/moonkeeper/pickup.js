import { TAU, burst, fly, fit, at, clamp, sparkle } from "../../core/index.js";

export const meta = {
  name: "Fragment pickup", desc: "A shard is absorbed: a gold glint, then six motes spray out and wink away.",
  tags: ["moonkeeper", "pickup", "one-shot"], size: [24, 24], origin: [12, 12], duration: 0.45, loop: false, fps: 12, bg: "dark",
  options: { palette: ["#7a5418", "#c08a22", "#e8c547", "#fff0a0", "#ffffff"], seed: 1 },
};

export function draw(p, t, o) {
  const C = fit(o.palette, 5), k = t / meta.duration;
  if (k < 0.5) sparkle(p, 0, 0, 5 * (1 - k * 2), C[4], C[3], 0.8);
  burst(6, o.seed, (r, i) => {
    const a = (i / 6) * TAU + r.range(-0.3, 0.3), sp = r.range(30, 45), life = r.range(0.3, 0.42);
    if (t >= life) return;
    const [x, y] = fly(0, 0, Math.cos(a) * sp, Math.sin(a) * sp, t, 0, 5);
    p.px(x, y, at([C[4], C[3], C[2], C[1]], t / life));
    p.light(x, y, C[2], 0.4 * (1 - t / life));
  });
  p.glow(0, 0, 9, C[2], 0.5 * clamp(1 - k * 1.6));
}
