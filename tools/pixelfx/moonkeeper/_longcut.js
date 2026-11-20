// Weapons sit on the right side of the moon and fire right. The long cut-in sequence shared by the moon's weapons: the screen dims, the moon glints, the weapon builds
// itself out of the moon, charges, fires in a flash and shockwave, then the band slams in and it all flies off.
import { TAU, seg, clamp, hex, lerp, ease, rng, sparkle } from "../../core/index.js";
import { band, at } from "./_cutin.js";
import * as moonFx from "./moon.js";

export const W = 400, H = 225, CY = H / 2, D = 2.8;
export const CHARGE = [1.32, 1.6], FLASH = 1.6, BAND = [1.78, 2.8], GLINT = [0.18, 0.5];
export const IRON = ["#0b0d1c", "#20253a", "#3a4058", "#5e6680", "#9aa3bc", "#dfe5f2"].map(hex);
export const BRASS = ["#2a1a0e", "#5a3a1c", "#8a5a2a", "#c08440", "#e8b468", "#fff0c8"].map(hex);
const VEIL = hex("#070b1f");
export const tone = (pal, v) => pal[clamp(Math.round(lerp(pal.length - 2, 1, (v + 1) / 2)), 0, pal.length - 1)];

/** weapon = { draw(p, k), mouth(k), shot(p, k), follow(k) }, k = { t, x0, ex, R, power, charge, leave, F, seed, camX } */
export function sequence(p, t, o, F, weapon) {
  const fadeIn = seg(t, 0, 0.15), fadeOut = 1 - seg(t, 2.65, 2.8);
  if (fadeOut <= 0) return;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) p.blend(x, y, VEIL, 0.82 * fadeIn * fadeOut);
  const kick = t > FLASH ? clamp(1 - (t - FLASH) / 0.4) : 0;
  const sx = Math.round(Math.sin(t * 95) * 4 * kick), sy = Math.round(Math.cos(t * 77) * 3 * kick);
  at(p, sx, sy, () => {
    const inBand = seg(t, BAND[0], BAND[0] + 0.2);
    if (t >= BAND[0]) at(p, 0, CY - 75, () => band(p, (t - BAND[0]) * 0.9 / (BAND[1] - BAND[0]), F[3], o.seed));
    const leave = ease.inCubic(seg(t, 2.45, 2.75));
    const R = lerp(lerp(30, 58, ease.outBack(seg(t, 0, 0.35))), 46, ease.inOutCubic(inBand));
    const ex = lerp(140, 105, ease.outCubic(inBand));
    const k = { t, ex, R, x0: ex + R - 6, leave, F, seed: o.seed, charge: seg(t, CHARGE[0], CHARGE[1]) };
    k.power = t < FLASH ? 0 : Math.min(1, (t - FLASH) / 0.15) * (1 - seg(t, 2.6, 2.8));
    const mouth = weapon.mouth(k);
    // the camera pans to keep the shot in view
    k.camX = Math.max(0, weapon.follow(k, mouth) - 230) * ease.inOutCubic(seg(t, 1.7, 2.2));
    p.place(p.tx - k.camX, p.ty, p.fx < 0);
    if (k.charge > 0 && t < FLASH) {
      for (let i = 0; i < 34; i++) {
        const g = rng(o.seed + 5, i), q = (k.charge * g.range(1, 2) + g.next()) % 1;
        const a = g.range(-1.2, 1.2), r = (1 - q) * 120;
        const px = mouth + Math.cos(a) * r, py = CY + Math.sin(a) * r * 0.7;
        p.line(px, py, px + Math.cos(a) * 8, py + Math.sin(a) * 5, q > 0.7 ? F[6] : F[4], 0.8);
      }
      p.glow(mouth, CY, 10 + k.charge * 30, F[5], 0.4 + k.charge * 0.5);
    }
    if (t >= FLASH) weapon.shot(p, k, mouth);
    weapon.behind?.(p, k);
    // a weapon may move or hide the moon itself, the orbit jump does
    const hero = weapon.hero ? weapon.hero(k) : { x: ex, show: true, scale: 1 };
    if (hero.show) {
      p.glow(hero.x, CY, R * 1.7 * hero.scale, F[3], 0.2 + 0.2 * k.power);
      at(p, hero.x, CY, () => moonFx.draw(p, t, { ...moonFx.meta.options, radius: R * hero.scale }));
    }
    weapon.draw(p, k);
    for (const gt of GLINT) {
      const q = seg(t, gt, gt + 0.22);
      if (q <= 0 || q >= 1) continue;
      const s = Math.sin(q * Math.PI);
      sparkle(p, ex - R * 0.5, CY - R * 0.62, 30 * s, F[6], F[5], 1);
      for (let i = 0; i < 200; i++) { const a = (i / 200) * TAU; p.blend(ex + Math.cos(a) * (R + 1), CY + Math.sin(a) * (R + 1), F[5], 0.8 * s); }
      p.glow(ex, CY, R * 2, F[4], 0.4 * s);
    }
    p.place(p.tx + k.camX, p.ty, p.fx < 0);
    const since = t - FLASH;
    if (since >= 0 && since < 0.12) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) p.blend(x - sx, y - sy, F[6], 0.75 * (1 - since / 0.12));
    if (since >= 0 && since < 0.45) {
      const q = since / 0.45, rr = 10 + q * 160;
      for (let i = 0; i < 220; i++) { const a = (i / 220) * TAU; p.dot(mouth - k.camX + Math.cos(a) * rr, CY + Math.sin(a) * rr * 0.55, q < 0.4 ? F[6] : F[4], 1 - q); }
    }
  });
}

/** the moon's surface x at height y, for parts that sit on it */
export const limb = (ex, R, y) => ex + Math.sqrt(Math.max(0, R * R - (y - CY) ** 2));
