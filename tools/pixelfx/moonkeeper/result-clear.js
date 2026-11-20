// Result title for a cleared run: 지구를 지켰다 in Galmuri pixel letters, soft rays turning behind it, a light sweep
// and twinkles around. Drawn 2x in game, centred on its origin.
import { TAU, clamp, hex, mix, seg, ease, rng, sparkle } from "../../core/index.js";
import { size, pixelWord, paintWord } from "./_pixeltext.js";

const W = 400, H = 90, D = 3, SCALE = 4;
const WORD = "지구를 지켰다";
const WHITE = hex("#ffffff");
const GOLD = ["#5a3a14", "#b07a1e", "#e8b440", "#ffd34a", "#fff0c8"].map(hex);

export const meta = {
  name: "Result: cleared", desc: "Result title for a cleared run: 지구를 지켰다 in thick gold strokes with soft rays turning behind, a light sweep and twinkles.",
  tags: ["moonkeeper", "result", "title", "loop"], size: [W, H], origin: [W / 2, H / 2], duration: D, loop: true, fps: 12, bg: "dark",
  options: { seed: 41 },
};

export function draw(p, t, o) {
  const tx0 = p.tx, ty0 = p.ty;
  p.place(tx0 - W / 2, ty0 - H / 2);
  const probe = size(WORD, SCALE);
  const top = Math.round((H - probe.h) / 2);
  const L = pixelWord(WORD, SCALE, Math.round((W - probe.w) / 2), top);

  // rays turning slowly behind the word, one full step per loop so it repeats clean
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU + (t / D) * (TAU / 12);
    // rays start outside the word so no hot spot gathers in the middle
    const x0 = W / 2 + Math.cos(a) * 60, y0 = H / 2 + Math.sin(a) * 22;
    p.line(x0, y0, W / 2 + Math.cos(a) * 200, H / 2 + Math.sin(a) * 80, GOLD[1], (u) => 0.35 * (1 - u));
    p.glowLine(x0, y0, W / 2 + Math.cos(a) * 160, H / 2 + Math.sin(a) * 64, 6, GOLD[2], 0.1);
  }

  paintWord(p, L, GOLD, { sweep: -40 + ease.inOutCubic(seg(t, 0.4, 1.6)) * (W + 80) });

  // twinkles popping around the word, each on its own beat
  for (let i = 0; i < 9; i++) {
    const g = rng(o.seed, i), x = g.range(20, W - 20), y = g.chance(0.5) ? g.range(4, top - 2) : g.range(top + probe.h + 3, H - 4);
    const k = Math.sin(((t / D) + g.next()) * TAU);
    if (k > 0.55) sparkle(p, x, y, 1 + 3 * (k - 0.55) / 0.45, WHITE, GOLD[4], 0.8);
  }
  p.place(tx0, ty0);
}
