import { TAU, clamp, fbm, fit, hex, rand } from "../../core/index.js";
import { LIGHT, lambert, bayer } from "./_lib.js";

export const meta = {
  name: "Earth",
  desc: "The home planet: oceans, two continents' worth of land, ice caps, clouds drifting faster than the ground, city lights on the night side, a thin blue atmosphere.",
  tags: ["moonkeeper", "planet", "loop"],
  size: [96, 96],
  origin: [48, 48],
  duration: 12,
  loop: true,
  fps: 12,
  bg: "dark",
  options: {
    palette: ["#0a1030", "#10215a", "#173b8a", "#2260b4", "#3a8bd6", "#6cb8ee"],
    land: ["#10241c", "#1d4a2c", "#2f7038", "#55933f", "#8fb057", "#c9c27a"],
    cloud: ["#4a5a86", "#8fa0c4", "#d6e2f2", "#f6fbff"],
    radius: 40,
    seed: 4,
  },
};

const CITY = hex("#ffd27a");

export function draw(p, t, o) {
  const SEA = fit(o.palette, 6), LAND = fit(o.land, 6), CL = fit(o.cloud, 4), R = o.radius;
  const ph = t / meta.duration, spin = ph * TAU, cspin = ph * TAU * 2;
  p.glow(0, 0, R + 10, SEA[4], 0.22);
  p.shade(-R - 1, -R - 1, R + 1, R + 1, (x, y, out) => {
    const nx = x / R, ny = y / R, d2 = nx * nx + ny * ny;
    if (d2 > 1) return 0;
    const nz = Math.sqrt(1 - d2), n = [nx, ny, nz], lum = lambert(n), b = bayer(x, y);
    const rot = (a) => [nx * Math.cos(a) + nz * Math.sin(a), -nx * Math.sin(a) + nz * Math.cos(a)];
    const [sx, sz] = rot(-spin);
    const h = 0.5 * (fbm(sx * 1.7 + 3, ny * 1.7 + 1, o.seed, 4) + fbm(sz * 1.7 + 9, ny * 1.7 + 6, o.seed + 7, 4));
    const ice = Math.abs(ny) > 0.9 + 0.12 * h;
    const [cx, cz] = rot(-cspin);
    const cl = 0.5 * (fbm(cx * 2.6 + 20, ny * 3.4, o.seed + 31, 3) + fbm(cz * 2.6 + 40, ny * 3.4 + 2, o.seed + 41, 3));
    const day = lum + b * 0.08;
    let c;
    if (cl > 0.16 && day > 0.05) {
      c = CL[clamp(Math.floor(day * 4.2 + (cl - 0.16) * 3), 0, 3)];
    } else if (ice) {
      c = day < 0.12 ? SEA[1] : CL[clamp(Math.floor(1 + day * 3), 1, 3)];
    } else if (h > 0.06) {
      const coast = h < 0.1;
      c = LAND[clamp(Math.floor(day * 5.2 + (coast ? 0.6 : 0) + b * 0.4), 0, 5)];
      // a few city lights on land that has gone dark
      if (day < 0.06 && h > 0.12 && rand(Math.floor(sx * 30), Math.floor(ny * 30), Math.floor(sz * 30), o.seed) < 0.06) {
        out.k = 0.5; out.l = CITY;
        return CITY;
      }
    } else {
      const shallow = h > -0.02;
      c = SEA[clamp(Math.floor(day * 4.6 + (shallow ? 0.8 : 0) + b * 0.4), 0, 5)];
      // the sun's glint off the sea
      const spec = 2 * lum * nz - LIGHT[2];
      if (spec > 0.975 + b * 0.03) c = SEA[5];
    }
    // atmosphere: a lit rim on the day side, a deep blue edge on the night side
    if (d2 > ((R - 1.2) * (R - 1.2)) / (R * R)) {
      out.k = 0.25 * lum; out.l = SEA[5];
      return lum > 0.15 ? SEA[5] : SEA[1];
    }
    return c;
  });
}
