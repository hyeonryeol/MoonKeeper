import { TAU, burst, fit, clamp, at, ease, seg } from "../../core/index.js";

// Orbit jump shockwave: the reverse of the jump's collapsing ring. A white flash where the moon lands or leaves,
// a cyan warp ring that snaps outward to the blast radius (80 px) and thins out, a fainter echo ring behind it,
// speed lines streaking out and sparks thrown clear. Same palette as orbit-jump.
export const meta = {
  name: "Orbit jump shockwave", desc: "Orbit jump shockwave: a white flash, a cyan warp ring snapping out to the blast radius with an echo ring, outward speed lines and sparks.",
  tags: ["moonkeeper", "scifi", "shockwave", "one-shot"], size: [184, 184], origin: [92, 92], duration: 0.6, loop: false, fps: 12, bg: "dark",
  options: { palette: ["#14466e", "#2f9fd0", "#5fd4e0", "#bff6ff", "#ffffff"], seed: 7, reach: 80 },
};

function ring(p, r, w, C, k, alpha, t) {
  const n = Math.ceil(r * 7);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    // the warp makes the ring wobble a little as it travels
    const wob = 1 + 0.045 * Math.sin(a * 6 + t * 24) * (1 - k);
    for (let j = 0; j < w; j++) {
      const rr = r * wob - j;
      // the leading edge is hottest, the trailing edge cools to cyan
      p.dot(Math.cos(a) * rr, Math.sin(a) * rr * 0.92, at([C[4], C[3], C[2], C[1]], clamp(k * 0.7 + j / w * 0.4)), alpha);
    }
  }
}

export function draw(p, t, o) {
  const C = fit(o.palette, 5), R = o.reach, k = t / meta.duration;
  const grow = ease.outExpo(seg(t, 0, 0.36)), fade = 1 - seg(t, 0.3, 0.6);
  if (fade <= 0) return;

  // white flash at the centre on the first frames
  const flash = 1 - seg(t, 0, 0.12);
  if (flash > 0) {
    p.circle(0, 0, 9 * flash + 1, C[4]);
    p.glow(0, 0, 30, C[3], 0.8 * flash);
  }

  // a faint ripple of the warp inside the ring
  const r = 6 + (R - 6) * grow;
  p.ring(0, 0, r - 2, Math.max(1, r * 0.1), C[1], 0.22 * fade * (1 - k));

  // the main ring and an echo a beat behind
  ring(p, r, Math.max(1, Math.round(3 * (1 - k))), C, k, fade, t);
  const r2 = 6 + (R - 6) * ease.outExpo(seg(t, 0.06, 0.45)) * 0.82;
  if (t > 0.06) ring(p, r2, 1, C, k + 0.3, 0.6 * fade, t + 0.3);
  p.glowRing(0, 0, r, 5, C[2], 0.3 * fade);

  // speed lines streaking out with the ring
  burst(18, o.seed, (g) => {
    const a = g.range(0, TAU), lag = g.range(0.4, 0.85), len = g.range(6, 14);
    const r1 = r * lag, r0 = Math.max(0, r1 - len * (1 - k));
    if (r1 < 4) return;
    p.line(Math.cos(a) * r0, Math.sin(a) * r0 * 0.92, Math.cos(a) * r1, Math.sin(a) * r1 * 0.92, g.chance(0.3) ? C[4] : C[3], 0.8 * fade);
  });

  // sparks thrown clear of the blast, slowing as they go
  burst(22, o.seed + 3, (g) => {
    const a = g.range(0, TAU), sp = g.range(0.7, 1.15), q = ease.outQuart(seg(t, 0, 0.55));
    const d = R * sp * q;
    const x = Math.cos(a) * d, y = Math.sin(a) * d * 0.92;
    p.px(x, y, g.chance(0.4) ? C[4] : C[2]);
    if (g.chance(0.4)) p.light(x, y, C[3], 0.5 * fade);
  });
}
