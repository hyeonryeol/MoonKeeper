import { TAU, clamp, Rng, fit } from "../../core/index.js";

export const meta = {
  name: "Moon",
  desc: "A small cratered moon, lit from the top left, slowly turning on its axis.",
  tags: ["moonkeeper", "planet", "moon", "loop"],
  size: [40, 40],
  origin: [20, 20],
  duration: 6,
  loop: true,
  fps: 12,
  bg: "dark",
  options: {
    palette: ["#14162b", "#2a2a44", "#4a4658", "#77707a", "#a39a8e", "#cbbf9f", "#e8dcb8", "#fbf4dc"],
    seed: 3,
    radius: 15,
  },
};

const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
const norm = (x, y, z) => { const l = Math.hypot(x, y, z); return [x / l, y / l, z / l]; };
const LIGHT = norm(-0.62, -0.55, 0.56);

// a point on the unit sphere from longitude and latitude
const sph = (lon, lat) => [Math.cos(lat) * Math.sin(lon), -Math.sin(lat), Math.cos(lat) * Math.cos(lon)];

export function draw(p, t, o) {
  const C = fit(o.palette, 8), R = o.radius, spin = (t / meta.duration) * TAU;
  const rng = new Rng(o.seed);
  const craters = [], maria = [];
  for (let i = 0; i < 4; i++) maria.push([((i + rng.range(0.2, 0.8)) / 4) * TAU, Math.asin(rng.range(-0.55, 0.55)), rng.range(0.5, 0.8)]);
  // spread evenly round the globe, never overlapping, so every face of the turn has a few
  const N = 12;
  for (let i = 0; i < N && craters.length < 40; i++) {
    for (let tries = 0; tries < 20; tries++) {
      const lon = ((i + rng.range(0.1, 0.9)) / N) * TAU, lat = Math.asin(rng.range(-0.8, 0.8)), size = rng.range(0.13, 0.3);
      const q = sph(lon, lat);
      const ok = craters.every(([l2, a2, s2]) => {
        const q2 = sph(l2, a2);
        return Math.acos(clamp(q[0] * q2[0] + q[1] * q2[1] + q[2] * q2[2], -1, 1)) > (size + s2) * 1.5;
      });
      if (ok) { craters.push([lon, lat, size]); break; }
    }
  }

  p.shade(-R - 1, -R - 1, R + 1, R + 1, (x, y) => {
    const nx = x / R, ny = y / R, d2 = nx * nx + ny * ny;
    if (d2 > 1) return 0;
    const nz = Math.sqrt(1 - d2);
    // the same point with the spin undone, so features ride round with the surface
    const c = Math.cos(-spin), s = Math.sin(-spin);
    const sx = nx * c + nz * s, sz = -nx * s + nz * c;
    let n = [nx, ny, nz], albedo = 1;

    for (const [lon, lat, size] of maria) {
      const q = sph(lon, lat);
      if (Math.acos(clamp(sx * q[0] + ny * q[1] + sz * q[2], -1, 1)) < size) { albedo = 0.74; break; }
    }
    for (const [lon, lat, size] of craters) {
      const q = sph(lon, lat), dist = Math.acos(clamp(sx * q[0] + ny * q[1] + sz * q[2], -1, 1));
      if (dist > size * 1.35) continue;
      // offset from the crater centre, turned back into screen space
      const vx0 = sx - q[0], vy = ny - q[1], vz0 = sz - q[2];
      const vx = vx0 * Math.cos(spin) + vz0 * Math.sin(spin), vz = -vx0 * Math.sin(spin) + vz0 * Math.cos(spin);
      const k = dist < size ? -1.1 : 0.9 * (1 - (dist - size) / (size * 0.35));
      n = norm(n[0] + (k * vx) / size, n[1] + (k * vy) / size, n[2] + (k * vz) / size);
      if (dist < size) albedo *= 0.92;
      break;
    }

    const lum = Math.max(0, n[0] * LIGHT[0] + n[1] * LIGHT[1] + n[2] * LIGHT[2]);
    const level = 1 + (lum * albedo) * 6.4;
    const b = BAYER[((Math.floor(y) & 3) << 2) | (Math.floor(x) & 3)] / 16 - 0.5;
    let i = clamp(Math.floor(level + b * 0.3), 1, 7);
    // the limb: a dark rim on the night side, one step down on the day side
    if (d2 > ((R - 1) * (R - 1)) / (R * R)) i = lum < 0.15 ? 0 : Math.max(1, i - 1);
    return C[i];
  });
  p.glow(0, 0, R + 4, C[6], 0.12);
}
