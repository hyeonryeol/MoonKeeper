import { fit } from "../../core/index.js";

export const meta = {
  name: "Turret bullet", desc: "An orange energy pellet flying right, a short hot streak behind it.",
  tags: ["moonkeeper", "projectile", "loop"], size: [12, 8], origin: [9, 4], duration: 0.25, loop: true, fps: 12, bg: "dark",
  options: { palette: ["#a8461f", "#f2854a", "#ffc46a", "#ffffff"], seed: 1 },
};

export function draw(p, t, o) {
  const C = fit(o.palette, 4), fl = t / meta.duration < 0.5;
  p.line(-7, 0, -1, 0, (u) => (u > 0.6 ? C[2] : u > 0.3 ? C[1] : C[0]), (u) => 0.4 + 0.6 * u);
  p.circle(0, 0, 1.6, C[1]);
  p.px(0, 0, fl ? C[3] : C[2]);
  p.px(1, 0, C[2]);
  p.glow(0, 0, 5, C[1], 0.45);
}
