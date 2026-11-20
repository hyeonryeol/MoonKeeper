// Opening 5: the moon wakes. A huge moon fills the bottom of the frame, a big turret on its top edge sits dead,
// barrel slumped onto the ground. Its panel lights flicker on, it shakes off the dust and stands up, the barrel swinging up to aim, then charges and fires.
import { TAU, clamp, seg, ease, lerp, hex, rng } from "../../core/index.js";
import { at } from "./_cutin.js";
import * as moonFx from "./moon.js";
import { W, H, sky, finish, wash, shock, puffs, shake, box, WHITE } from "./_intro.js";

const D = 5.8, MX = 215, MY = 285, MR = 150;
const POWER = 1.5, LIFT = 2.2, UP = 3.3, FIRE = 4.2;
const LAMP = hex("#ffd27a"), GLASS = ["#173b8a", "#2f6fd0", "#8fc4ff"].map(hex), RED = hex("#ff4a3a");
const CYAN = hex("#6ff0ff"), ORANGE = hex("#ff8a2a"), SHOT = hex("#ffe27a");
const M = ["#0c0d1a", "#1c1c30", "#2e2d44", "#4a4658", "#77707a", "#a39a8e", "#cbbf9f"].map(hex);

export const meta = {
  name: "Intro 5: the turret wakes", desc: "Opening scene: a dead turret slumped on the moon powers up, lights flicker on, it stands and swings its barrel up to aim, charges and fires.",
  tags: ["moonkeeper", "intro", "one-shot"], size: [W, H], origin: [0, 0], duration: D, loop: false, fps: 20, bg: "dark",
  options: { seed: 44 },
};

const top = (x) => MY - Math.sqrt(Math.max(0, MR * MR - (x - MX) ** 2));

export function draw(p, t, o) {
  const lift = ease.outBack(seg(t, LIFT, UP), 1.2), fireAge = t - FIRE;
  const kick = t > LIFT && t < UP ? 1.5 : fireAge > 0 && fireAge < 0.5 ? 4 * (1 - fireAge / 0.5) : 0;
  const [sx, sy] = shake(t, kick);
  sky(p, o.seed, t * 3 + sx, sy);

  at(p, sx, sy, () => {
    p.glow(MX, MY, MR + 24, hex("#fbf4dc"), 0.1);
    at(p, MX, MY, () => moonFx.draw(p, 0.8 + t * 0.05, { ...moonFx.meta.options, radius: MR }));

    // the turret, center top
    const tx = MX + 25, ty = top(tx) + 4;
    const alive = t > POWER, flick = t < POWER + 0.5 ? (Math.floor(t * 18) % 3 !== 0 ? 1 : 0) : 1;
    // a pulse of power through the mount as it switches on
    shock(p, tx, ty - 6, t - POWER, 0.6, 60, CYAN);
    // the mount: a wide foot, a hydraulic neck that extends as it stands
    // a sloped skirt that sits the foot down into the curved ground
    p.poly([[tx - 46, ty + 3], [tx + 46, ty + 3], [tx + 56, top(tx + 56) + 6], [tx - 56, top(tx - 56) + 6]], M[1]);
    p.poly([[tx - 46, ty + 3], [tx - 30, ty + 3], [tx - 38, top(tx - 50) + 6], [tx - 56, top(tx - 56) + 6]], M[2]);
    p.rect(tx - 46, ty - 8, 92, 12, M[2]);
    p.rect(tx - 46, ty - 8, 92, 3, M[4]);
    p.rect(tx - 42, ty - 2, 84, 3, M[1]);
    const neck = 5 + 22 * lift, hy = ty - 8 - neck;
    p.rect(tx - 12, hy, 24, neck, M[3]);
    p.rect(tx - 12, hy, 5, neck, M[5]);
    p.rect(tx + 8, hy, 4, neck, M[1]);
    for (let k = 0; k < neck; k += 4) p.line(tx - 12, hy + k, tx + 11, hy + k, M[2]);

    // the head: an angular armored housing on a bearing ring, slumped forward while dead, upright when standing
    const headAng = lerp(0.42, 0, lift), bx = tx, by = hy - 4;
    const cB = Math.cos(headAng), sB = Math.sin(headAng);
    const T = (u, v) => [bx + u * cB - v * sB, by + u * sB + v * cB];
    const poly = (pts, c) => p.poly(pts.map(([u, v]) => T(u, v)), c);
    // the bearing ring between neck and head
    p.rect(tx - 20, hy - 4, 40, 5, M[2]);
    p.rect(tx - 20, hy - 4, 40, 2, M[4]);
    for (let k = -16; k <= 16; k += 8) p.px(tx + k, hy - 1, M[1]);
    // the housing: dark outline, mid body, a lit top facet, a shadowed belly, panel seams and vents
    poly([[-36, 6], [-40, -4], [-30, -24], [14, -30], [38, -16], [42, 6]], M[0]);
    poly([[-34, 4], [-38, -4], [-28, -22], [13, -28], [36, -15], [40, 4]], M[3]);
    poly([[-38, -4], [-28, -22], [13, -28], [36, -15], [30, -13], [10, -23], [-24, -17], [-33, -4]], M[5]);
    poly([[-28, -22], [13, -28], [12, -26], [-27, -20]], M[6]);
    poly([[-34, 4], [40, 4], [38, -1], [-35, -1]], M[2]);
    poly([[-20, -12], [-4, -14], [-4, -2], [-20, -1]], M[2]);
    for (let k = 0; k < 4; k++) poly([[-18, -11 + k * 3], [-6, -12.5 + k * 3], [-6, -11.5 + k * 3], [-18, -10 + k * 3]], M[1]);
    p.line(...T(0, -26), ...T(0, 3), M[2]);
    p.line(...T(24, -21), ...T(26, 3), M[2]);
    // panel lights: a row of cyan slits along the belly and a sensor eye on the front
    const on = alive && flick;
    for (let k = 0; k < 6; k++) {
      const [x, y] = T(-30 + k * 6, 1);
      p.rect(x - 1, y - 1, 3, 2, on ? CYAN : M[0]);
      if (on) p.light(x, y, CYAN, 0.5);
    }
    {
      const [x, y] = T(33, -8), eye = t > LIFT ? ORANGE : RED;
      p.disc(x, y, 4, M[0], 1);
      p.disc(x, y, 2.6, alive ? eye : M[1], 1);
      if (alive) { p.px(x - 1, y - 1, WHITE); p.glow(x, y, 9, eye, 0.7 * flick); }
    }

    // the guns: twin barrels in one shroud, pitching around the trunnion on the head
    const [pivX, pivY] = T(8, -12);
    const aim = lerp(0.62, -0.62, lift) + headAng * 0;
    const L = 104;
    const recoil = fireAge > 0 ? Math.max(0, 8 * (1 - fireAge / 0.3)) : 0;
    const ca = Math.cos(aim), sa = Math.sin(aim);
    const ox = pivX - ca * recoil, oy = pivY - sa * recoil;
    const Q = (u, v) => [ox + u * ca - v * sa, oy + u * sa + v * ca];
    // two barrels with bands, lit on top
    for (const off of [-5, 5]) {
      const [x0, y0] = Q(0, off);
      box(p, x0, y0, aim, L, 3.2, (u, v) => {
        if (Math.abs(v) > 2.6) return M[0];
        if (u > 40 && u % 16 < 1.6) return M[2];
        return v < -0.8 ? M[6] : v < 1 ? M[4] : M[3];
      });
      // muzzle brake: a fat block with ports
      const [mx0, my0] = Q(L - 12, off);
      box(p, mx0, my0, aim, 12, 4.6, (u, v) => (Math.abs(v) > 3.8 ? M[0] : u > 3 && u < 5.5 ? M[0] : u > 7 && u < 9 ? M[0] : v < 0 ? M[5] : M[3]));
    }
    // the shroud over both barrels near the pivot: an armored box with energy coils
    box(p, ox, oy, aim, 48, 10.5, (u, v) => {
      if (Math.abs(v) > 9.6 || u > 47) return M[0];
      if (u > 14 && u < 42 && Math.abs(v) < 3 && Math.floor(u) % 4 < 2) {
        const k = seg(t, POWER + 0.3, LIFT + 0.4);
        return u - 14 < 28 * k && alive ? CYAN : M[1];
      }
      return v < -6 ? M[6] : v < -1 ? M[5] : v < 5 ? M[3] : M[2];
    });
    const coil = seg(t, POWER + 0.3, LIFT + 0.4);
    if (alive && coil > 0) { const [gx, gy] = Q(28, 0); p.glow(gx, gy, 16, CYAN, 0.35 * coil * flick); }
    // the trunnion: a big round mantlet with a bolt ring that hides the joint
    p.disc(pivX, pivY, 13, M[0], 1);
    p.disc(pivX, pivY, 11.5, (d, a) => (d > 0.8 ? M[2] : Math.sin(a + 0.8) < -0.3 ? M[5] : M[3]), 1);
    p.disc(pivX, pivY, 5, (d, a) => (Math.sin(a + 0.8) < 0 ? M[4] : M[2]), 1);
    for (let k = 0; k < 8; k++) {
      const a = (k / 8) * TAU + aim;
      p.px(pivX + Math.cos(a) * 8.5, pivY + Math.sin(a) * 8.5, M[1]);
    }
    if (alive) { p.px(pivX, pivY, on ? CYAN : M[1]); if (on) p.light(pivX, pivY, CYAN, 0.6); }
    const [mx, my] = Q(L, 0);
    // dust shaken off as it stands, pebbles falling from the barrel
    puffs(p, tx, ty - 4, t - LIFT, 12, o.seed + 70, 60, 8, 1.4);
    if (t > LIFT && t < UP + 0.4)
      for (let i = 0; i < 10; i++) {
        const g = rng(o.seed + 80, i), a0 = t - LIFT - g.range(0, 0.6);
        if (a0 < 0) continue;
        const f = g.range(0.2, 0.9), x = pivX + Math.cos(aim) * L * f + g.range(-2, 2), y = pivY + Math.sin(aim) * L * f + 0.5 * 120 * a0 * a0;
        if (y < ty) p.px(x, y, M[4]);
      }

    // charge at the muzzle, then a shot streaks off to the top right
    const charge = seg(t, UP + 0.2, FIRE);
    if (charge > 0 && fireAge < 0) {
      p.glow(mx, my, 4 + charge * 14, SHOT, 0.5 + charge * 0.5);
      p.disc(mx, my, 1 + charge * 4, WHITE, 0.9);
      for (let i = 0; i < 8; i++) {
        const g = rng(Math.floor(t * 12), i), a = g.range(0, TAU), d = (1 - ((t * 3 + g.range(0, 1)) % 1)) * 24;
        p.px(mx + Math.cos(a) * d, my + Math.sin(a) * d, i % 2 ? CYAN : SHOT);
      }
    }
    if (fireAge > 0) {
      const d = fireAge * 900, len = 70;
      const x1 = mx + Math.cos(aim) * d, y1 = my + Math.sin(aim) * d;
      p.glowLine(x1 - Math.cos(aim) * len, y1 - Math.sin(aim) * len, x1, y1, 5, SHOT, 0.8);
      p.line(x1 - Math.cos(aim) * len, y1 - Math.sin(aim) * len, x1, y1, WHITE);
      shock(p, mx, my, fireAge, 0.5, 40, SHOT);
      p.glow(mx, my, 20, SHOT, 0.8 * clamp(1 - fireAge / 0.3));
      const f = clamp(1 - fireAge / 0.12);
      if (f > 0) wash(p, WHITE, 0.4 * f);
    }
  });

  finish(p, t, D, 0.4, 0.6);
}
