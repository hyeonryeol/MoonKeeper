// Opening 1: a quiet day in 2187. The camera drifts in on a huge earth lit from the top left, a ring of small
// defense satellites circles it, the moon hangs far off, and one big satellite drifts past right in front of us.
import { TAU, hex, ease, seg, lerp } from "../../core/index.js";
import { at } from "./_cutin.js";
import * as earthFx from "./earth.js";
import * as moonFx from "./moon.js";
import { W, H, sky, finish, wash, satellite } from "./_intro.js";

const D = 5.0, CX = 200, CY = 150;
const SUN = hex("#ffe2a8"), SKY = hex("#3a8bd6"), FLARE = ["#ffd27a", "#8fc4ff", "#c36bff"].map(hex);

export const meta = {
  name: "Intro 1: peace", desc: "Opening scene: a slow push in on a huge earth, a ring of defense satellites, the moon far off and a big satellite drifting past the camera.",
  tags: ["moonkeeper", "intro", "one-shot"], size: [W, H], origin: [0, 0], duration: D, loop: false, fps: 20, bg: "dark",
  options: { seed: 41 },
};

export function draw(p, t, o) {
  const z = lerp(1, 1.12, ease.inOutSine ? ease.inOutSine(t / D) : t / D);
  const Z = (x, y) => [CX + (x - CX) * z, CY + (y - CY) * z];
  sky(p, o.seed, t * 6, 0);

  // sunlight spilling in from the top left
  p.glow(-20, -30, 170, SUN, 0.22);

  // the moon, far away on the right
  const [mx, my] = Z(lerp(338, 318, t / D), 78);
  p.glow(mx, my, 20 * z, hex("#fbf4dc"), 0.15);
  at(p, mx, my, () => moonFx.draw(p, t * 0.4, { ...moonFx.meta.options, radius: Math.round(13 * z) }));

  // the earth and the ring of satellites around it, the far half behind
  const [ex, ey] = Z(150, 190), ER = Math.round(100 * z);
  const ring = (back) => {
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * TAU + t * 0.25, d = Math.sin(a);
      if ((d < 0) !== back) continue;
      const [x, y] = Z(150 + Math.cos(a) * 150, 190 + d * 44 - 20);
      satellite(p, x, y, 0.15 + Math.cos(a) * 0.1, 1, t, i, (0.42 + d * 0.12) * z);
    }
  };
  ring(true);
  p.glow(ex, ey, ER + 30, SKY, 0.32);
  at(p, ex, ey, () => earthFx.draw(p, 2 + t * 0.35, { ...earthFx.meta.options, radius: ER }));
  // a bright rim of atmosphere on the sunny side
  p.arc(ex, ey, ER + 1, 2, Math.PI * 1.05, Math.PI * 1.7, hex("#8fd0ff"), 0.8);
  p.glowRing(ex, ey, ER + 2, 5, hex("#6cb8ee"), 0.25);
  ring(false);

  // the near satellite drifting across the frame, much faster than everything else (parallax)
  const k = seg(t, 0, D);
  satellite(p, lerp(470, 250, k), lerp(105, 128, k), lerp(0.35, 0.05, k), 1, t, 9, 2.7 * z);

  // a soft lens flare along the line from the sun
  for (const [f, r, c] of [[0.35, 6, 0], [0.55, 10, 1], [0.8, 4, 2]]) {
    const fx = -20 + (CX * 2 + 20) * f, fy = -30 + (CY * 2 + 30) * f;
    p.disc(fx, fy, r, FLARE[c], 0.12);
  }

  finish(p, t, D, 0.6, 0.5);
}
