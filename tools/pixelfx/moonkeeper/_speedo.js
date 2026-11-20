// Orbit dial speedometer shared by speedo-hud.js: an orbit dial. A thick band fills from teal (inner orbit) to gold (outer orbit) as the moon
// speeds up, the earth is the hub, and a small moon rides the needle's tip. No numbers.
// One frame per speed step: frame i shows the dial at i / STEPS of the way from the slowest to the fastest speed.
// The game picks the frame from the moon's speed.
import { hex, mix } from "../../core/index.js";
import * as moonFx from "./moon.js";
import * as earthFx from "./earth.js";

export const STEPS = 40;
const NAVY = ["#070b1f", "#0e1330", "#161d44"].map(hex);
const IRON = ["#0b0d1c", "#20253a", "#3a4058", "#5e6680", "#9aa3bc"].map(hex);
const TEAL = hex("#5fd4e0"), GOLD = hex("#e8c547"), WHITE = hex("#ffffff");
const deg = (d) => (d * Math.PI) / 180;
const ang = (q) => deg(135 + q * 270);


function at(p, x, y, fn) {
  const tx = p.tx, ty = p.ty;
  p.place(tx + x, ty + y);
  fn();
  p.place(tx, ty);
}

/** The dial in a box of size S with band radius R. speedo-hud draws the same dial smaller. */
export function dial(p, t, S, R, earthR, moonR) {
  const CX = S / 2, CY = S / 2, band = Math.max(3, Math.round(R / 7));
  const k = Math.min(STEPS, Math.round(t)) / STEPS;
  // work in top left coordinates of the frame
  const tx0 = p.tx, ty0 = p.ty;
  p.place(tx0 - CX, ty0 - CY);

  // bezel and face
  p.circle(CX, CY, R + 4, IRON[1]);
  p.ring(CX, CY, R + 4, 1, IRON[3]);
  p.arc(CX, CY, R + 4, 1, deg(190), deg(290), IRON[4]);
  p.circle(CX, CY, R + 2, NAVY[0]);
  // the band, empty part dark, filled part from teal to gold
  for (let i = 0; i < 40; i++) {
    const q0 = i / 40, q1 = (i + 1.05) / 40;
    p.arc(CX, CY, R - 1, band, ang(q0), ang(q1), q0 < k ? mix(TEAL, GOLD, q0) : NAVY[2]);
  }
  // the lit end of the band glows a little
  if (k > 0) p.glow(CX + Math.cos(ang(k)) * (R - 4), CY + Math.sin(ang(k)) * (R - 4), 10, mix(TEAL, GOLD, k), 0.35);
  // ticks inside the band
  for (let i = 0; i <= 8; i++) {
    const a = ang(i / 8);
    for (let d = 0; d < (i % 4 === 0 ? 3 : 1); d++) p.px(CX + Math.cos(a) * (R - band - 4 - d), CY + Math.sin(a) * (R - band - 4 - d), IRON[4]);
  }
  // needle from the hub to the band
  const a = ang(k), ux = Math.cos(a), uy = Math.sin(a);
  for (let i = earthR + 1; i <= R - band - 3; i++) {
    p.px(CX + ux * i, CY + uy * i, WHITE);
    p.px(CX + ux * i - uy * 0.7, CY + uy * i + ux * 0.7, mix(WHITE, NAVY[0], 0.4));
  }
  at(p, CX, CY, () => earthFx.draw(p, 3, { ...earthFx.meta.options, radius: earthR }));
  const mx = CX + ux * (R - 4), my = CY + uy * (R - 4);
  p.glow(mx, my, 9, mix(TEAL, GOLD, k), 0.45);
  at(p, mx, my, () => moonFx.draw(p, 1, { ...moonFx.meta.options, radius: moonR }));
  p.place(tx0, ty0);
}

