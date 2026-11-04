import { fbm, rand, fit, clamp, hex, mix } from "../../core/index.js";

export const meta = {
  name: "Space background", desc: "The playfield backdrop at half size, drawn 2x to fill 800 x 600: deep navy space, faint violet and teal nebula, stars of three sizes.",
  tags: ["moonkeeper", "background"], size: [400, 300], origin: [0, 0], duration: 1, loop: true, fps: 1, bg: "dark",
  options: { palette: ["#070b1f", "#0e1330", "#161d44", "#2a2a5c", "#3a4580"], nebula: ["#3b2370", "#1f5a6e"], seed: 11 },
};

export function draw(p, t, o) {
  const C = fit(o.palette, 5), N = o.nebula.map(hex), star = [hex("#7f86ae"), hex("#c9cce0"), hex("#fbf4dc")];
  p.shade(0, 0, 400, 300, (x, y, out) => {
    const n1 = fbm(x / 110, y / 110, o.seed, 4), n2 = fbm(x / 80 + 40, y / 80, o.seed + 9, 4);
    // hard steps with a little ordered dither, so the nebula reads as pixel art, not an airbrush
    const B = ([0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5][((y & 3) << 2) | (x & 3)] / 16 - 0.5) * 0.25;
    const q = (k) => clamp(Math.round(k * 4 + B * 4) / 4);
    let c = mix(C[0], C[1], q(0.5 + n1 * 0.9));
    const v = q(clamp((n1 - 0.08) * 2.4)), te = q(clamp((n2 - 0.15) * 2.2));
    if (v > 0) c = mix(c, N[0], v * 0.45);
    if (te > 0) c = mix(c, N[1], te * 0.35);
    const s = rand(x, y, o.seed);
    if (s < 0.003) return star[0];
    if (s < 0.0042) return star[1];
    return c;
  });
  // a few bright stars with a cross glint
  for (let i = 0; i < 14; i++) {
    const x = Math.floor(rand(i, 1, o.seed) * 400), y = Math.floor(rand(i, 2, o.seed) * 300);
    p.px(x, y, star[2]);
    if (i % 3 === 0) { p.px(x - 1, y, star[1]); p.px(x + 1, y, star[1]); p.px(x, y - 1, star[1]); p.px(x, y + 1, star[1]); }
    p.glow(x, y, 4, star[1], 0.25);
  }
}
