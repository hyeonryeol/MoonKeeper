// Pierce laser pop-up: the moon fires a cyan beam across the band. See _popup.js.
import { W, CY, popMeta, band, heroX, moon, timing, seg, hex } from "./_popup.js";

export const meta = popMeta("Pop-up: piercing laser", "Small piercing laser pop-up: the moon fires a cyan beam across a slanted band.");
const F = ["#14466e", "#2f9fd0", "#5fd4e0", "#9ff0ff", "#ffffff"].map(hex);

export function draw(p, t, o) {
  const b = band(p, t, F[2], o.seed);
  if (!b) return;
  const x = heroX(t, 34), { close } = timing(t);
  const k = seg(t, 0.22, 0.3) * (1 - close);
  if (k > 0) {
    const x0 = x + 12, x1 = Math.min(W, b.right(CY) - 2);
    const flick = 0.85 + 0.15 * Math.sin(t * 90);
    p.rect(x0, CY - 4 * k, x1 - x0, 8 * k, F[1], 0.7);
    p.rect(x0, CY - 2 * k, x1 - x0, 4 * k, F[3]);
    p.rect(x0, CY - 1, x1 - x0, 2, F[4]);
    p.glowLine(x0, CY, x1, CY, 8, F[2], 0.5 * flick);
    p.glow(x0, CY, 10, F[4], 0.6);
  }
  moon(p, t, x, CY, F[2]);
}
