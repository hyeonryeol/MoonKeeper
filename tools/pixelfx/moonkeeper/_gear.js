// Gear that bolts onto the moon. Every piece faces right: its foot at (0, 0) sits on the moon's surface and the
// game turns it to where it is mounted. Small enough to read at 1x, outlined so it holds against the moon.
import { TAU, rng, bolt, fly, cycle, at, clamp } from "../../core/index.js";

export const GP = {
  k: "#14162b", d: "#3a3f5c", m: "#6b7394", l: "#a9b4d0", w: "#eef3ff",
  o: "#f2854a", O: "#a8461f", y: "#e8c547", c: "#5fd4e0", C: "#2a7f99", p: "#b48cf5", P: "#5b3a9e", r: "#e0463a",
  g: "#ffd34a", n: "#b07a1e",
};
const hx = (s) => parseInt(s.slice(1), 16);
const col = (k) => { const v = hx(GP[k]); return (255 << 24) | ((v & 255) << 16) | (v & 0xff00) | ((v >> 16) & 255); };
export const G = Object.fromEntries(Object.keys(GP).map((k) => [k, col(k)]));

const centre = (rows) => -Math.floor(rows.length / 2);

export const TURRET = [
  "..kkkk......",
  ".kmllmk.....",
  "kmlwllmkkkkk",
  "kmllmmmmmmlk",
  "kmmomdmkkkkk",
  ".kdddddk....",
  "..kkkkk.....",
];
export const LASER = [
  "..kkk.........",
  ".kmlmkkkkkkk..",
  "kmlwlddddddck.",
  "kmllcCCCCCcwk.",
  "kmmmddddddck..",
  ".kdddkkkkkkk..",
  "..kkk.........",
];
export const POD = [
  "kkkkkkkk....",
  "kmllllmkkk..",
  "kmwlllmdrrk.",
  "kmooooomkkk.",
  "kmllllmkkk..",
  "kmlmmmmdrrk.",
  "kmmmmmmkkk..",
  "kkkkkkkk....",
];
export const SPIKES = [
  "kk.......",
  "kmkk.....",
  "kmlmkk...",
  "kmllmwk..",
  "kmlmkk...",
  "kmlmmkk..",
  "kmlllmmwk",
  "kmdmmkk..",
  "kmlmkk...",
  "kmllmwk..",
  "kmlmkk...",
  "kmkk.....",
  "kk.......",
];
export const NOZZLE = [
  "kkk......",
  "kmlkk....",
  "kmllmkkk.",
  "kmlwlmmdk",
  "kmllmmmdk",
  "kmmdmmmdk",
  "kmmmmkkk.",
  "kmdkk....",
  "kkk......",
];
export const COIL = [
  "kk.k.k.k...",
  "kmkOkOkOk..",
  "kmOyOyOyOk.",
  "kmlylylylkk",
  "kmOyOyOyOk.",
  "kmkOkOkOk..",
  "kk.k.k.k...",
];

export function gear(p, rows, x = 0) {
  p.sprite(rows, GP, x, centre(rows));
}

/** A crackle of electricity between two points, new shape every frame. */
export function zap(p, t, x0, y0, x1, y1, seed) {
  const f = Math.floor(t * 12), r = rng(seed, f);
  const path = bolt(r, x0, y0, x1, y1, { jag: 0.35, depth: 3 });
  p.polyline(path, G.c);
  p.glowLine(x0, y0, x1, y1, 3, G.c, 0.3);
}

/** Exhaust: a hot core, a flickering plume, sparks blown back. Faces right from (x, y). */
export function plume(p, t, x, y, len, seed, D) {
  const f = 0.8 + 0.2 * Math.sin(t * 50 + seed);
  for (let i = 0; i < 6; i++) {
    const u = i / 6;
    p.disc(x + u * len * f, y, (1 - u) * 2.2 + 0.4, u < 0.3 ? G.w : u < 0.6 ? G.y : G.o, 0.9 - u * 0.6);
  }
  cycle(t, D, 8, seed, 0.18, (age, L, r) => {
    const [px, py] = fly(x + 1, y + r.range(-1, 1), r.range(40, 80), r.range(-15, 15), age);
    p.px(px, py, at([G.y, G.o, G.O], age / L));
  });
  p.glow(x + len * 0.4, y, len + 3, G.o, 0.35);
}

// Upgrades: every level adds parts, Lv3 adds gold trim and more light.
export const LASER2 = [
  "..kkk...........",
  ".kmlmkkkkkkkkk..",
  "kmlwlddddddddck.",
  "kmllcCCCCCCCcwk.",
  "kmmmdkkkkkkkkk..",
  "kmllcCCCCCCCcwk.",
  "kmmmddddddddck..",
  ".kdddkkkkkkkkk..",
  "..kkk...........",
];
export const LASER3 = [
  "..kkkk............",
  ".kmlgkkkkkkkkkkk..",
  "kmlwgdddddddddcwk.",
  "kmllgCCCCCCCCCcwk.",
  "kmmmgkkkkkkkkkkkk.",
  "kmllgCCCCCCCCCCcwk",
  "kmmmgkkkkkkkkkkkk.",
  "kmllgCCCCCCCCCcwk.",
  "kmmmgdddddddddcwk.",
  ".kddgkkkkkkkkkkk..",
  "..kkkk............",
];
export const POD2 = [
  "kkkkkkkkkk..",
  "kmwlllmdrrk.",
  "kmllllmkkk..",
  "kmooooodrrk.",
  "kmllllmkkk..",
  "kmlmmmmdrrk.",
  "kmmmmmmkkk..",
  "kkkkkkkk....",
];
export const POD3 = [
  "kkkkkkkkkkk..",
  "kgwllllgdrrk.",
  "kmllllllkkkk.",
  "kmoooooodrrk.",
  "kmllllllkkkk.",
  "kmlllllldrrk.",
  "kmllllllkkkk.",
  "kmoooooodrrk.",
  "kgmmmmmgkkkk.",
  "kkkkkkkk.....",
];
export const SPIKES2 = [
  "kk.........",
  "kmkk.......",
  "kmllmwk....",
  "kmlkk......",
  "kmlmmkk....",
  "kmlllmmwk..",
  "kmldmkk....",
  "kmlkk......",
  "kmlllmmmmwk",
  "kmlkk......",
  "kmldmkk....",
  "kmlllmmwk..",
  "kmlmmkk....",
  "kmlkk......",
  "kmllmwk....",
  "kmkk.......",
  "kk.........",
];
export const SPIKES3 = SPIKES2.map((r) => r.replace(/w/g, "g").replace(/^km/, "kn"));
export const NOZZLE2 = [
  "kkk........",
  "kmlkk......",
  "kmllmkkk...",
  "kmlwllmmkk.",
  "kmllllmmmdk",
  "kmllmmmmmdk",
  "kmmdmmmmmdk",
  "kmmmmmmmkk.",
  "kmmmmkkk...",
  "kmdkk......",
  "kkk........",
];
export const NOZZLE3 = NOZZLE2.map((r) => (r.length > 4 && "lmd".includes(r[4]) ? r.slice(0, 4) + "g" + r.slice(5) : r));
export const COIL2 = [
  "kk.k.k.k.k...",
  "kmkOkOkOkOk..",
  "kmOyOyOyOyOk.",
  "kmOyOyOyOyOk.",
  "kmlylylylylkk",
  "kmOyOyOyOyOk.",
  "kmOyOyOyOyOk.",
  "kmkOkOkOkOk..",
  "kk.k.k.k.k...",
];
export const COIL3 = [
  "kk.k.k.k.k.k...",
  "kmkOkOkOkOkOk..",
  "kmOyOyOyOyOyOk.",
  "kmOyOyOyOyOyOk.",
  "kmlylylylylylkk",
  "kmOyOyOyOyOyOk.",
  "kmOyOyOyOyOyOk.",
  "kmkOkOkOkOkOk..",
  "kk.k.k.k.k.k...",
].map((r) => r.replace(/O/g, "n").replace(/y/g, "g"));
export const DRONE1 = [
  "...kk...",
  "..kllk..",
  ".kmlwmk.",
  "kmmccmmk",
  "kdmCcmdk",
  ".kdmmdk.",
  "..kddk..",
  "...kk...",
];
export const DRONE2 = [
  "....kk....",
  "...kllk...",
  "k.kmlwmk.k",
  "kmkmccmkmk",
  "kdkdCcmkdk",
  "k.kdmmdk.k",
  "...kddk...",
  "....kk....",
];
export const DRONE3 = DRONE2.map((r) => r.replace(/d/g, "n").replace(/l/g, "g"));

/** Exhaust, hot = a bluer, whiter jet for the top level. */
export function plume2(p, t, x, y, len, seed, D, hot) {
  const f = 0.8 + 0.2 * Math.sin(t * 50 + seed), ramp = hot ? [G.w, G.c, G.C] : [G.w, G.y, G.o];
  for (let i = 0; i < 7; i++) {
    const u = i / 7;
    p.disc(x + u * len * f, y, (1 - u) * (len / 5) + 0.5, u < 0.3 ? ramp[0] : u < 0.6 ? ramp[1] : ramp[2], 0.9 - u * 0.6);
  }
  cycle(t, D, 10, seed, 0.18, (age, L, r) => {
    const [px, py] = fly(x + 1, y + r.range(-1.5, 1.5), r.range(50, 100), r.range(-18, 18), age);
    p.px(px, py, at(hot ? [G.w, G.c, G.C] : [G.y, G.o, G.O], age / L));
  });
  p.glow(x + len * 0.4, y, len + 4, ramp[1], 0.4);
}
