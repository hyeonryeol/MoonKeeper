import { TAU, seg, clamp, hex, sparkle } from "../../core/index.js";
import { W, H, D, band, heroX, moon, timing } from "./_cutin.js";

export const meta = {
  name: "Cut-in: piercing laser", desc: "Skill cut-in: the band slams in, the moon bursts in and fires a screen-wide cyan beam that ripples and flares.",
  tags: ["moonkeeper", "cutin", "one-shot"], size: [W, H], origin: [0, 0], duration: D, loop: false, fps: 12, bg: "dark",
  options: { seed: 11 },
};

const C = ["#14466e", "#2f9fd0", "#5fd4e0", "#bff6ff", "#ffffff"].map(hex);

export function draw(p, t, o) {
  const b = band(p, t, C[2], o.seed);
  if (!b) return;
  const x = heroX(t, 96), y = 75, { close } = timing(t);
  // the beam fires once the moon has landed
  const fire = seg(t, 0.26, 0.34) * (1 - close);
  if (fire > 0) {
    const x0 = x + 40;
    for (let px = Math.floor(x0); px < W; px++) {
      const u = (px - x0) / (W - x0), w = (7 + 3 * Math.sin(u * TAU * 3 - t * 40)) * fire;
      for (let dy = -Math.ceil(w) - 2; dy <= Math.ceil(w) + 2; dy++) {
        const d = Math.abs(dy);
        if (d > w + 2) continue;
        p.px(px, y + dy, d < w * 0.3 ? C[4] : d < w * 0.65 ? C[3] : d < w ? C[2] : C[1]);
      }
    }
    p.glowLine(x0, y, W, y, 30 * fire, C[2], 0.5);
    sparkle(p, x0, y, 14 * fire, C[4], C[3], 0.9);
  }
  moon(p, t, x, y, 44, C[2]);
}
