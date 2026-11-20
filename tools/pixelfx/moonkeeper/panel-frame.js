// Side panel frame: a dark riveted iron plate with a thin brass trim, the same hardware as the cut-in machines.
// 100 x 300, drawn 2x in game for each 200 x 600 side panel. Left and right right are the same, so it is symmetric.
import { hex, rand, clamp } from "../../core/index.js";

const W = 100, H = 300;
const NAVY = ["#070b1f", "#0b1028", "#10173a"].map(hex);
const IRON = ["#0b0d1c", "#20253a", "#3a4058", "#5e6680", "#9aa3bc"].map(hex);
const BRASS = ["#2a1a0e", "#5a3a1c", "#8a5a2a", "#c08440", "#e8b468"].map(hex);
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];

export const meta = {
  name: "Side panel frame", desc: "Side panel frame: a dark riveted iron plate with brass trim and corner brackets, symmetric, drawn 2x beside the playfield.",
  tags: ["moonkeeper", "ui", "panel"], size: [W, H], origin: [0, 0], duration: 1, loop: true, fps: 1, bg: "dark",
  options: { seed: 61 },
};

function rivet(p, x, y) {
  p.px(x, y, BRASS[3]); p.px(x + 1, y, BRASS[2]); p.px(x, y + 1, BRASS[2]); p.px(x + 1, y + 1, BRASS[1]);
  p.px(x, y - 1, IRON[0]); p.px(x - 1, y, IRON[0]);
}

export function draw(p, t, o) {
  plate(p, o, W, H);
}

/** The plate at any size, the Tab gear panel uses a shorter one. */
export function plate(p, o, W, H) {
  // the plate: deep navy with faint brushed streaks, darker toward the edges
  p.shade(0, 0, W, H, (x, y) => {
    const edge = Math.min(x, W - 1 - x, y, H - 1 - y);
    const v = clamp(edge / 18) * 0.6 + rand(Math.floor(x / 3), Math.floor(y), o.seed) * 0.25;
    const b = BAYER[((Math.floor(y) & 3) << 2) | (Math.floor(x) & 3)] / 16 - 0.5;
    return NAVY[clamp(Math.round(v * 2 + b * 0.5), 0, 2)];
  });
  // iron border, two steps, lit from the top left
  p.rect(0, 0, W, 2, IRON[2]); p.rect(0, H - 2, W, 2, IRON[1]);
  p.rect(0, 0, 2, H, IRON[2]); p.rect(W - 2, 0, 2, H, IRON[1]);
  p.rect(2, 2, W - 4, 1, IRON[3]); p.rect(2, 2, 1, H - 4, IRON[3]);
  p.rect(2, H - 3, W - 4, 1, IRON[0]); p.rect(W - 3, 2, 1, H - 4, IRON[0]);
  // brass trim just inside the border
  p.rect(5, 5, W - 10, 1, BRASS[2]); p.rect(5, H - 6, W - 10, 1, BRASS[1]);
  p.rect(5, 5, 1, H - 10, BRASS[2]); p.rect(W - 6, 5, 1, H - 10, BRASS[1]);
  // corner brackets
  for (const [cx, cy, sx, sy] of [[3, 3, 1, 1], [W - 4, 3, -1, 1], [3, H - 4, 1, -1], [W - 4, H - 4, -1, -1]]) {
    for (let i = 0; i < 9; i++) {
      p.px(cx + sx * i, cy, BRASS[i < 2 ? 4 : 3]);
      p.px(cx, cy + sy * i, BRASS[i < 2 ? 4 : 3]);
      p.px(cx + sx * i, cy + sy, BRASS[1]);
      p.px(cx + sx, cy + sy * i, BRASS[1]);
    }
    rivet(p, cx + sx * 4 + (sx < 0 ? -1 : 0), cy + sy * 4 + (sy < 0 ? -1 : 0));
  }
  // rivets along the sides
  for (let y = 30; y < H - 20; y += 30) { rivet(p, 9, y); rivet(p, W - 11, y); }
  // a header plate across the top where the panel title sits
  p.rect(14, 12, W - 28, 13, IRON[1]);
  p.rect(14, 12, W - 28, 1, IRON[3]); p.rect(14, 24, W - 28, 1, IRON[0]);
  rivet(p, 17, 17); rivet(p, W - 19, 17);
}
