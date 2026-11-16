import { fit, TAU } from "../../core/index.js";

export const meta = {
  name: "Piercing laser", desc: "A tileable horizontal beam segment: white core, cyan sheath, energy rippling along it.",
  tags: ["moonkeeper", "projectile", "beam", "loop"], size: [32, 9], origin: [0, 4], duration: 0.5, loop: true, fps: 12, bg: "dark",
  options: { palette: ["#14466e", "#2f9fd0", "#5fd4e0", "#bff6ff", "#ffffff"], seed: 1 },
};

export function draw(p, t, o) {
  const C = fit(o.palette, 5), ph = t / meta.duration;
  for (let x = 0; x < 32; x++) {
    const w = 2.2 + 0.8 * Math.sin((x / 32) * TAU * 2 - ph * TAU);
    for (let y = -4; y <= 4; y++) {
      const d = Math.abs(y);
      if (d > w + 0.5) continue;
      p.px(x, y, d < 0.6 ? C[4] : d < w * 0.5 ? C[3] : d < w ? C[2] : C[1]);
    }
  }
  p.glowLine(0, 0, 32, 0, 6, C[2], 0.35);
}
