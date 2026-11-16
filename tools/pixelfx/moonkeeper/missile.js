import { G, GP } from "./_gear.js";

export const meta = {
  name: "Homing missile", desc: "A small red-tipped missile flying right on a flickering flame.",
  tags: ["moonkeeper", "projectile", "loop"], size: [24, 8], origin: [16, 4], duration: 0.5, loop: true, fps: 12, bg: "dark",
  options: { seed: 2 },
};

const BODY = [
  ".kkk.....",
  "kmlkkkkk.",
  "kdllllmrk",
  "kmdddddrk",
  "kmkkkkkk.",
  ".kkk.....",
];

export function draw(p, t) {
  for (let i = 0; i < 5; i++) {
    const u = i / 5, f = 0.8 + 0.2 * Math.sin(t * 60 + i);
    p.disc(-5 - u * 6 * f, 0, (1 - u) * 1.8 + 0.3, u < 0.3 ? G.w : u < 0.6 ? G.y : G.o, 0.9 - u * 0.6);
  }
  p.glow(-7, 0, 6, G.o, 0.35);
  p.sprite(BODY, GP, -4, -3);
}
