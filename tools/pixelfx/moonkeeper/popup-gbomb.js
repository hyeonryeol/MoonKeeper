// Gravity bomb pop-up: the moon throws a violet singularity that spins up into a little vortex. See _popup.js.
import { TAU } from "../../core/index.js";
import { CY, popMeta, band, heroX, moon, timing, inside, seg, hex } from "./_popup.js";

export const meta = popMeta("Pop-up: gravity bomb", "Small gravity bomb pop-up: the moon throws a violet singularity that spins into a vortex.");
const P = ["#2a1650", "#5b3a9e", "#8a5fe0", "#b48cf5", "#e4d4ff", "#ffffff"].map(hex);

export function draw(p, t, o) {
  const b = band(p, t, P[3], o.seed);
  if (!b) return;
  const x = heroX(t, 34), { close } = timing(t);
  const k = seg(t, 0.2, 0.36) * (1 - close), cx = 140 + close * 120;
  if (k > 0) {
    for (let arm = 0; arm < 3; arm++)
      for (let i = 0; i < 30; i++) {
        const u = i / 30, r = (3 + u * 20) * k, a = (arm * TAU) / 3 + u * 4.5 - t * 10;
        const px = cx + Math.cos(a) * r * 1.4, py = CY + Math.sin(a) * r * 0.75;
        if (inside(b, px, py)) p.px(px, py, u < 0.3 ? P[5] : u < 0.6 ? P[4] : P[2]);
      }
    p.disc(cx, CY, 5 * k, P[0], 0.95);
    p.glow(cx, CY, 22 * k, P[2], 0.7);
    p.glow(cx, CY, 6 * k, P[4], 0.6);
  }
  moon(p, t, x, CY, P[2]);
}
