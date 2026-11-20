// Earth thruster pop-up: the earth fires a blue jet behind it and lurches forward. See _popup.js.
import { CY, popMeta, band, heroX, earth, timing, seg, hex, mix } from "./_popup.js";

export const meta = popMeta("Pop-up: earth thruster", "Small earth thruster pop-up: the earth fires a blue jet behind it and lurches forward.");
const F = ["#123a8c", "#1f6fd0", "#3fa8f0", "#7fdcff", "#ffffff"].map(hex);

export function draw(p, t, o) {
  const b = band(p, t, F[2], o.seed);
  if (!b) return;
  const { close } = timing(t);
  const fire = seg(t, 0.22, 0.32) * (1 - close);
  const x = heroX(t, 120) + fire * 14;
  if (fire > 0) {
    // a teardrop jet streaming left from the back of the earth
    const len = 70 * fire, flick = 0.85 + 0.15 * Math.sin(t * 80);
    for (let i = 0; i < len; i++) {
      const u = i / len, w = (1 - u) * 9 * flick;
      p.line(x - 12 - i, CY - w, x - 12 - i, CY + w, mix(F[3], F[0], u), 0.7 * (1 - u * 0.6));
    }
    p.glow(x - 14, CY, 14, F[4], 0.6);
  }
  earth(p, t, x, CY, F[2]);
}
