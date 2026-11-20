// Boss arrival: the whole screen. The earth fills the bottom as a huge dome, a giant black rock sinks in from
// the top and its shadow spreads down over the earth, then the magma cracks blaze on all at once.
// 400 x 300, drawn 2x in game to cover the 800 x 600 screen. The title is left to the game's font.
import { TAU, seg, clamp, hex, lerp, ease, rng } from "../../core/index.js";
import { at } from "./_cutin.js";
import * as bossFx from "./asteroid-boss.js";
import * as earthFx from "./earth.js";

const W = 400, H = 300, D = 3.0;
const REVEAL = 1.7;
const SPACE = hex("#05081a"), INK = hex("#020205"), WHITE = hex("#ffffff");
const SKY = hex("#3a8bd6"), RED = ["#3a0a0c", "#7a1414", "#c0261c", "#f2561d", "#ffae35", "#ffe27a"].map(hex);
const EX = 200, EY = 440, ER = 200;
const BX = 200, BR = 210;
const BLACK = ["#020205", "#040409", "#06060d", "#090912", "#0c0b16", "#0f0d1a"];

export const meta = {
  name: "Cut-in: boss", desc: "Boss arrival over the whole screen: the earth fills the bottom, a giant black rock sinks in from the top and its shadow spreads over the earth, then its magma cracks blaze on all at once.",
  tags: ["moonkeeper", "cutin", "boss", "one-shot"], size: [W, H], origin: [0, 0], duration: D, loop: false, fps: 12, bg: "dark",
  options: { seed: 31 },
};

export function draw(p, t, o) {
  const fadeIn = seg(t, 0, 0.3);
  if (t >= 2.8) return;
  const show = 1;
  p.rect(0, 0, W, H, SPACE, 1);
  for (let i = 0; i < 70; i++) {
    const g = rng(o.seed, i);
    p.px(g.range(0, W), g.range(0, H), g.chance(0.2) ? WHITE : hex("#8fa0c4"));
  }

  const lit = t > REVEAL, age = t - REVEAL;
  const kick = lit ? clamp(1 - age / 0.6) * 5 : seg(t, 1.0, REVEAL) * 1.5;
  const sx = Math.round(Math.sin(t * 91) * kick), sy = Math.round(Math.cos(t * 73) * kick);
  // how far the rock has come down, its lowest edge goes from above the screen to just past the middle
  const fall = ease.outCubic(seg(t, 0.2, 2.2));
  const by = lerp(-BR - 40, 145 - BR, fall);

  at(p, sx, sy, () => {
    // the earth dome with a thin blue atmosphere
    p.glow(EX, EY, ER + 30, SKY, 0.35);
    at(p, EX, EY, () => earthFx.draw(p, 2 + t * 0.6, { ...earthFx.meta.options, radius: ER }));

    // the shadow: darker toward the top of the dome and deeper as the rock comes down
    const sk = ease.inOutCubic(seg(t, 0.4, 2.0));
    const top = EY - ER;
    if (sk > 0)
      for (let y = top - 2; y < H; y++)
        for (let x = 0; x < W; x++) {
          if (Math.hypot(x - EX, y - EY) > ER + 2) continue;
          const reach = 40 + 160 * sk;
          const k = clamp(1 - (y - top) / reach) * 0.9 * sk + 0.25 * sk;
          p.blend(x, y, INK, clamp(k) * show);
        }

    // the rock: a black shape while it sinks, then the cracks blaze
    if (lit) p.glow(BX, by + BR * 0.8, BR * 0.9, RED[3], 0.35 * clamp(1 - age / 0.5) * show);
    at(p, BX, by, () => bossFx.draw(p, 1 + t * 0.25, { ...bossFx.meta.options, radius: BR, ...(lit ? {} : { palette: BLACK, magma: BLACK.slice(0, 5) }) }));
    if (!lit) {
      // the earth's blue light glows faintly on its underside, and a few embers glint inside
      p.glow(BX, by + BR, BR * 0.8, SKY, 0.12 * fall);
      for (let i = 0; i < 18; i++) {
        const g = rng(o.seed + 3, i), a = g.range(0.3, Math.PI - 0.3), d = g.range(0.2, 0.8) * BR, x = BX + Math.cos(a) * d, y = by + Math.sin(a) * d;
        if (Math.sin(t * g.range(6, 12) + g.range(0, TAU)) > 0.6 && t > 1.0) p.px(x, y, RED[2 + (i % 3)]);
      }
    } else {
      // extra magma cracks that tear open across the underside all at once
      const grow = ease.outCubic(seg(age, 0, 0.3)), heat = 0.75 + 0.25 * Math.sin(t * TAU * 2);
      for (let c = 0; c < 10; c++) {
        const g = rng(o.seed + 50, c);
        const a0 = g.range(0.35, Math.PI - 0.35), d0 = g.range(0.25, 0.8) * BR;
        let x = BX + Math.cos(a0) * d0, y = by + Math.sin(a0) * d0, dir = g.range(0, TAU);
        const steps = Math.floor(g.range(8, 16) * grow);
        for (let k = 0; k < steps; k++) {
          dir += g.range(-0.7, 0.7);
          const nx = x + Math.cos(dir) * 6, ny = y + Math.sin(dir) * 6;
          if (Math.hypot(nx - BX, ny - by) > BR * 0.9 || ny > H) break;
          p.line(x, y, nx, ny, k % 3 ? RED[3] : RED[4], heat);
          p.light(nx, ny, RED[3], 0.5 * heat);
          x = nx; y = ny;
        }
      }
      // rocks shaken loose, falling toward the earth
      for (let i = 0; i < 24; i++) {
        const g = rng(o.seed + 9, i), x = g.range(40, 360), sp = g.range(60, 140);
        const y = by + BR - 10 + ((age * sp + g.range(0, 40)) % 160);
        p.line(x, y - 6, x, y, RED[2], 0.5);
        p.disc(x, y, g.range(1, 2.2), g.chance(0.4) ? RED[3] : hex("#4e3638"));
      }
    }

    if (lit && age < 0.5) {
      // the flash
      const f = clamp(1 - age / 0.2);
      if (f > 0) p.rect(0, 0, W, H, WHITE, 0.45 * f);
    }
  });

  // cut to black at the start and fade through black at the end back to the game
  const black = Math.max(1 - fadeIn, seg(t, 2.55, 2.85));
  if (black > 0) p.rect(0, 0, W, H, INK, black);
}
