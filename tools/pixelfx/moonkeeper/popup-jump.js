// Orbit jump pop-up: the moon blinks out through a warp ring and pops out the far side with a trail. See _popup.js.
import { TAU } from "../../core/index.js";
import { CY, popMeta, band, heroX, moon, timing, seg, hex, mix } from "./_popup.js";

export const meta = popMeta("Pop-up: orbit jump", "Small orbit jump pop-up: the moon blinks through a warp ring and pops out the far side with a trail.");
const F = ["#14466e", "#2f9fd0", "#5fd4e0", "#9ff0ff", "#ffffff"].map(hex);

export function draw(p, t, o) {
  const b = band(p, t, F[2], o.seed);
  if (!b) return;
  const { close } = timing(t);
  const jump = seg(t, 0.3, 0.38);
  // two warp rings, where the moon goes in and where it comes out
  const rings = [[70, seg(t, 0.16, 0.3) * (1 - seg(t, 0.4, 0.5))], [160 + close * 120, seg(t, 0.3, 0.4) * (1 - close)]];
  for (const [gx, k] of rings) {
    if (k <= 0) continue;
    for (let i = 0; i < 24; i++) {
      const a = (i / 24) * TAU;
      p.px(gx + Math.cos(a) * 6 * k, CY + Math.sin(a) * 15 * k, i % 3 ? F[2] : F[4]);
    }
    p.glow(gx, CY, 14 * k, F[2], 0.5);
  }
  if (jump < 1) {
    moon(p, t, Math.min(heroX(t, 34) + jump * 36, 70), CY, F[2]);
  } else {
    // a streak left behind as it pops out
    const x = 160 + close * 120;
    for (let i = 1; i < 8; i++) p.line(x - 10 - i * 6, CY - 6 + i, x - 4 - i * 6, CY - 6 + i, mix(F[3], F[0], i / 8), 0.6);
    moon(p, t, x, CY, F[2]);
  }
}
