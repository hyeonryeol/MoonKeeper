// Wave banner shared by wave-1 .. wave-9 and boss-incoming: the characters drop in one by one and slam down with a
// flash, a light sweep passes, then they break up and dither away. 3 s to fill the rest between waves.
// 240 x 70, drawn 2x in game, centred on its origin.
import { clamp, hex, seg, ease, rng } from "../../core/index.js";
import { size, pixelWord, paintWord, bayer } from "./_pixeltext.js";

export const W = 240, H = 70, D = 3;
const SCALE = 4, DROP = 0.09, FALL = 0.28;
export const GOLD = ["#5a3a14", "#b07a1e", "#e8b440", "#ffd34a", "#fff0c8"].map(hex);
export const RED = ["#3a0a0c", "#7a1414", "#c0261c", "#f2561d", "#ffd0a0"].map(hex);

export function meta(name, word, desc) {
  return {
    name, desc, tags: ["moonkeeper", "ui", "banner", "one-shot"], size: [W, H], origin: [W / 2, H / 2],
    duration: D, loop: false, fps: 12, bg: "dark", options: { word, seed: 71 },
  };
}

export function banner(p, t, o, C) {
  const tx0 = p.tx, ty0 = p.ty;
  p.place(tx0 - W / 2, ty0 - H / 2);
  const probe = size(o.word, SCALE);
  const top = Math.round((H - probe.h) / 2);
  const L = pixelWord(o.word, SCALE, Math.round((W - probe.w) / 2), top);
  const out = seg(t, 2.45, 2.85);

  // each character falls in on its own beat, lands with a flash, and stays hidden before it starts
  const land = L.chars.map((c, i) => i * DROP + FALL);
  const dys = L.chars.map((c, i) => {
    const k = seg(t, i * DROP, i * DROP + FALL);
    return k <= 0 ? 9999 : (1 - ease.outBack(k)) * -26;
  });
  paintWord(p, L, C, {
    dys,
    sweep: -30 + ease.inOutCubic(seg(t, 1.0, 1.7)) * (W + 60),
    flash: (i) => (t - land[i] >= 0 && t - land[i] < 0.12 ? 0.8 : 0),
    // break up at the end: dithered pixels drop out from the top down, outline and shadow too
    gone: (x, y) => out > 0 && bayer(x, y) + 0.5 < out * 1.3 - clamp((y - top) / probe.h) * 0.3,
  });

  // dust kicked up where each character lands
  L.chars.forEach((c, i) => {
    const since = t - land[i];
    if (since < 0 || since > 0.4) return;
    for (let j = 0; j < 6; j++) {
      const g = rng(o.seed + i, j), dir = j < 3 ? -1 : 1;
      const x = c.x + c.w / 2 + dir * (c.w / 2 + since * g.range(20, 50)), y = top + probe.h + 2 - since * g.range(4, 14);
      p.dot(x, y, C[3], 1 - since / 0.4);
    }
    p.glow(c.x + c.w / 2, top + probe.h / 2, 18, C[3], 0.3 * (1 - since / 0.4));
  });
  p.place(tx0, ty0);
}
