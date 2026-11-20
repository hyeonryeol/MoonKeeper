// Title logo: the Korean word 달지기 in Galmuri pixel letters, gold with a dark outline and drop shadow, a light
// sweep gliding across it, MOON KEEPER underneath, and a little moon on a tilted orbit that passes behind the
// letters and in front again. Drawn 2x in game, centred on its origin.
import { TAU, clamp, hex, mix, seg, ease, sparkle } from "../../core/index.js";
import * as moonFx from "./moon.js";
import { size, pixelWord, paintWord } from "./_pixeltext.js";

const W = 220, H = 110, D = 3;
const SHADOW = hex("#070b1f");
const GOLD = ["#5a3a14", "#b07a1e", "#e8b440", "#ffd34a", "#fff0c8"].map(hex);
const CYAN = hex("#5fd4e0"), CYAN_D = hex("#2a7f99"), WHITE = hex("#ffffff");

export const meta = {
  name: "Title logo", desc: "Title logo: 달지기 in Galmuri gold pixel letters with a dark outline and drop shadow, a light sweep across it, MOON KEEPER below and a small moon circling the word on a tilted orbit.",
  tags: ["moonkeeper", "title", "logo", "loop"], size: [W, H], origin: [W / 2, H / 2], duration: D, loop: true, fps: 12, bg: "dark",
  options: { seed: 3 },
};

// strokes of each syllable in units, the box is 16 wide and 18 tall
const WORD = "달지기", SCALE = 5;
const WORD_W = size(WORD, SCALE).w, WORD_H = size(WORD, SCALE).h;
const LX = Math.round((W - WORD_W) / 2), LY = 14;

// the moon's orbit: a tilted ellipse around the word, far half behind the letters
const OX = W / 2, OY = LY + WORD_H / 2, RX = 100, RY = 22, TILT = -0.12;
function orbitAt(a) {
  const x = Math.cos(a) * RX, y = Math.sin(a) * RY;
  return [OX + x * Math.cos(TILT) - y * Math.sin(TILT), OY + x * Math.sin(TILT) + y * Math.cos(TILT)];
}

function orbit(p, t, far) {
  for (let i = 0; i < 90; i++) {
    const a = (i / 90) * TAU;
    if ((Math.sin(a) < 0) !== far || i % 2) continue;
    const [x, y] = orbitAt(a);
    p.dot(x, y, CYAN_D, far ? 0.5 : 0.8);
  }
  const a = (t / D) * TAU;
  if ((Math.sin(a) < 0) !== far) return;
  const [mx, my] = orbitAt(a);
  // a short trail behind the moon
  for (let k = 1; k < 10; k++) {
    const [tx, ty] = orbitAt(a - k * 0.035);
    p.dot(tx, ty, CYAN, 0.7 * (1 - k / 10));
  }
  p.glow(mx, my, 12, CYAN, 0.3);
  const tx = p.tx, ty = p.ty;
  p.place(tx + mx, ty + my);
  moonFx.draw(p, t * 2, { ...moonFx.meta.options, radius: far ? 6 : 7 });
  p.place(tx, ty);
}

export function draw(p, t, o) {
  // work in top left coordinates of the canvas
  const tx0 = p.tx, ty0 = p.ty;
  p.place(tx0 - W / 2, ty0 - H / 2);
  orbit(p, t, true);

  // gold by height with a sweep of light gliding across
  paintWord(p, pixelWord(WORD, SCALE, LX, LY), GOLD, { sweep: lerpX(ease.inOutCubic(seg(t, 0.6, 1.8))) });

  // subtitle
  p.text("MOON KEEPER", W / 2 + 1, LY + WORD_H + 9, SHADOW, { font: "big", align: "center" });
  p.text("MOON KEEPER", W / 2, LY + WORD_H + 8, CYAN, { font: "big", align: "center" });

  // a glint that pops on the last syllable once the sweep passes
  const g = seg(t, 1.6, 2.1);
  if (g > 0 && g < 1) sparkle(p, LX + WORD_W - 4, LY + 2, 2 + 5 * Math.sin(g * Math.PI), WHITE, WHITE, 0.9);

  orbit(p, t, false);
  p.place(tx0, ty0);
}

function lerpX(k) {
  return -30 + k * (W + 60);
}
