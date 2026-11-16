import { GP, G } from "./_gear.js";

export const meta = {
  name: "Orbit drone", desc: "A tiny diamond drone with a cyan eye and blinking wingtips; it circles the moon and rams things.",
  tags: ["moonkeeper", "gear", "loop"], size: [12, 12], origin: [6, 6], duration: 1, loop: true, fps: 12, bg: "dark",
  options: { seed: 1 },
};

const BODY = [
  "...kk...",
  "..kllk..",
  ".kmlwmk.",
  "kmmccmmk",
  "kdmCcmdk",
  ".kdmmdk.",
  "..kddk..",
  "...kk...",
];

export function draw(p, t) {
  p.sprite(BODY, GP, -4, -4);
  const on = t % 1 < 0.5;
  p.light(-4, 0, on ? G.r : G.c, 0.5);
  p.light(3, 0, on ? G.c : G.r, 0.5);
  p.glow(0, 0, 4, G.c, 0.25);
}
