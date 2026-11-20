// Result title for a lost run: 지구가 무너졌다 in Galmuri pixel letters, ember red and split by dark cracks, a hot glow that
// flickers in the cracks and embers drifting up off the letters. Drawn 2x in game, centred on its origin.
import { TAU, clamp, hex, rng, cycle } from "../../core/index.js";
import { size, pixelWord, paintWord } from "./_pixeltext.js";

const W = 400, H = 90, D = 3, SCALE = 4;
const WORD = "지구가 무너졌다";
const RED = ["#3a0a0c", "#7a1414", "#c0261c", "#f2561d", "#ffae35", "#ffe27a"].map(hex);

export const meta = {
  name: "Result: game over", desc: "Result title for a lost run: 지구가 무너졌다 in ember red strokes split by dark cracks, a flickering hot glow and embers drifting up.",
  tags: ["moonkeeper", "result", "title", "loop"], size: [W, H], origin: [W / 2, H / 2], duration: D, loop: true, fps: 12, bg: "dark",
  options: { seed: 43 },
};

export function draw(p, t, o) {
  const tx0 = p.tx, ty0 = p.ty;
  p.place(tx0 - W / 2, ty0 - H / 2);
  const probe = size(WORD, SCALE);
  const top = Math.round((H - probe.h) / 2);
  const L = pixelWord(WORD, SCALE, Math.round((W - probe.w) / 2), top);
  const flick = 0.75 + 0.25 * Math.sin((t / D) * TAU * 5) * Math.sin((t / D) * TAU * 3);

  p.glow(W / 2, H / 2 + 10, 150, RED[1], 0.3 * flick);

  // jagged cracks running down through the word
  const cracks = [];
  for (let c = 0; c < 7; c++) {
    const g = rng(o.seed, c);
    let x = (W - probe.w) / 2 + (c + 0.5) * probe.w / 7 + g.range(-6, 6), y = top - 2;
    const pts = [[x, y]];
    while (y < top + probe.h + 2) { y += g.range(3, 6); x += g.range(-3, 3); pts.push([x, y]); }
    cracks.push(pts);
  }
  const nearCrack = (x, y) => {
    for (const pts of cracks)
      for (let i = 1; i < pts.length; i++) {
        const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
        if (y < y0 || y > y1) continue;
        const cx = x0 + (x1 - x0) * (y - y0) / (y1 - y0 || 1);
        if (Math.abs(x - cx) < 1) return 2;
        if (Math.abs(x - cx) < 2) return 1;
      }
    return 0;
  };

  paintWord(p, L, RED, {
    tint(x, y, c, out) {
      const n = nearCrack(x, y);
      // the crack itself is dark with heat glowing out of it
      if (n === 2) { out.l = RED[3]; out.k = 0.5 * flick; return RED[0]; }
      return n === 1 ? RED[4] : c;
    },
  });

  // embers lifting off the letters and cooling as they rise
  cycle(t, D, 30, o.seed + 5, (g) => g.range(1.2, 2.4), (age, life, g) => {
    const k = age / life, x = g.range((W - probe.w) / 2, (W + probe.w) / 2) + Math.sin(age * 3 + g.range(0, TAU)) * 3;
    const y = top + probe.h - g.range(0, probe.h) - age * g.range(10, 22);
    if (y < 1) return;
    const c = k < 0.3 ? RED[5] : k < 0.6 ? RED[4] : RED[3];
    p.dot(x, y, c, 1 - k * 0.6);
    p.light(x, y, RED[3], 0.5 * (1 - k));
  });
  p.place(tx0, ty0);
}
