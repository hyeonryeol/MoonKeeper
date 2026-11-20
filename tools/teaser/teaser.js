// 달지기 티저, three.js 장면
// 모든 움직임은 시간 t 하나로 정해져서 어느 프레임이든 바로 그릴 수 있음
// window.renderFrame(프레임 번호)를 부르면 그 프레임을 그림
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const W = 1280, H = 720, FPS = 30, DUR = 33;
// 장면 시간표
const T = { open: 0, swarm: 5, moon: 10, play: 16.5, boss: 26.5, logo: 29, end: DUR };

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const seg = (t, a, b) => clamp((t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
const easeOut = (k) => 1 - Math.pow(1 - k, 3);
const easeInOut = (k) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2);
const V = (x, y, z) => new THREE.Vector3(x, y, z);

function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const hash3 = (x, y, z) => { const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return h - Math.floor(h); };
function noise3(x, y, z) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z), fx = x - ix, fy = y - iy, fz = z - iz;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
  const c = (a, b, d) => hash3(ix + a, iy + b, iz + d);
  return lerp(lerp(lerp(c(0, 0, 0), c(1, 0, 0), u), lerp(c(0, 1, 0), c(1, 1, 0), u), v),
              lerp(lerp(c(0, 0, 1), c(1, 0, 1), u), lerp(c(0, 1, 1), c(1, 1, 1), u), v), w);
}
function fbm3(x, y, z, oct = 5) {
  let s = 0, a = 0.5, n = 0;
  for (let i = 0; i < oct; i++) { s += noise3(x, y, z) * a; n += a; x *= 2.03; y *= 2.03; z *= 2.03; a *= 0.5; }
  return s / n;
}

// ---- 그림 재료 만들기
function sphereCanvas(w, h, fn) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d'), img = ctx.createImageData(w, h), d = img.data;
  for (let y = 0; y < h; y++) {
    const lat = (0.5 - y / h) * Math.PI, cl = Math.cos(lat), sy = Math.sin(lat);
    for (let x = 0; x < w; x++) {
      const lon = (x / w) * Math.PI * 2, px = cl * Math.cos(lon), pz = cl * Math.sin(lon);
      const [r, g, b, a] = fn(px, sy, pz, lat);
      const i = (y * w + x) * 4;
      d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = a;
    }
  }
  ctx.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  return t;
}
const mix3 = (a, b, k) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];

function earthTextures() {
  const land = (x, y, z) => fbm3(x * 1.7 + 3, y * 1.7, z * 1.7, 6) + fbm3(x * 5, y * 5, z * 5 + 9, 3) * 0.12;
  const map = sphereCanvas(1024, 512, (x, y, z, lat) => {
    const n = land(x, y, z), ice = Math.abs(lat) > 1.2 + fbm3(x * 4, y * 4, z * 4, 3) * 0.25;
    let c;
    if (ice) c = [236, 244, 252];
    else if (n > 0.56) {
      const k = clamp((n - 0.56) / 0.2), dry = fbm3(x * 3 + 20, y * 3, z * 3, 3);
      c = mix3(mix3([47, 112, 56], [85, 147, 63], k), [201, 194, 122], clamp((dry - 0.5) * 3) * 0.8);
      if (n < 0.575) c = [214, 205, 150];
    } else {
      c = mix3([16, 33, 90], [58, 139, 214], clamp((n - 0.3) / 0.26));
    }
    return [c[0], c[1], c[2], 255];
  });
  const lights = sphereCanvas(1024, 512, (x, y, z, lat) => {
    const n = land(x, y, z);
    const on = n > 0.58 && Math.abs(lat) < 1.1 && hash3(Math.floor(x * 90), Math.floor(y * 90), Math.floor(z * 90)) > 0.93
      && fbm3(x * 6 + 40, y * 6, z * 6, 2) > 0.55;
    return on ? [255, 210, 122, 255] : [0, 0, 0, 255];
  });
  const clouds = sphereCanvas(1024, 512, (x, y, z) => {
    const n = fbm3(x * 2.6 + 11, y * 3.4, z * 2.6, 5);
    return [255, 255, 255, clamp((n - 0.52) * 7) * 235];
  });
  return { map, lights, clouds };
}

function moonTexture() {
  const r = rng(77), craters = [];
  for (let i = 0; i < 70; i++) {
    const u = r() * 2 - 1, a = r() * Math.PI * 2, s = Math.sqrt(1 - u * u);
    craters.push([s * Math.cos(a), u, s * Math.sin(a), 0.05 + r() * r() * 0.22]);
  }
  return sphereCanvas(1024, 512, (x, y, z) => {
    let v = 0.62 + (fbm3(x * 3, y * 3, z * 3, 5) - 0.5) * 0.5;
    if (fbm3(x * 1.2 + 7, y * 1.2, z * 1.2, 3) > 0.56) v -= 0.14;
    for (const [cx, cy, cz, cr] of craters) {
      const d = Math.acos(clamp(x * cx + y * cy + z * cz, -1, 1)) / cr;
      if (d < 1) v += d > 0.82 ? 0.16 : -0.13 * (1 - d * 0.5);
    }
    const g = clamp(v) * 255;
    return [g * 0.98, g * 0.95, g * 0.86, 255];
  });
}

function nebulaTexture() {
  const c = document.createElement('canvas');
  c.width = 2048; c.height = 1024;
  const ctx = c.getContext('2d'), r = rng(5);
  ctx.fillStyle = '#04050f';
  ctx.fillRect(0, 0, c.width, c.height);
  for (let i = 0; i < 70; i++) {
    const x = r() * c.width, y = r() * c.height, rad = 120 + r() * 380;
    const g = ctx.createRadialGradient(x, y, 0, x, y, rad);
    const col = r() < 0.5 ? '59,35,112' : r() < 0.5 ? '31,90,110' : '22,29,68';
    g.addColorStop(0, `rgba(${col},${0.10 + r() * 0.12})`);
    g.addColorStop(1, `rgba(${col},0)`);
    ctx.fillStyle = g;
    ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    // 왼쪽 끝과 오른쪽 끝이 이어지게 한 번 더
    for (const shift of [c.width, -c.width]) { ctx.save(); ctx.translate(shift, 0); ctx.fillRect(x - rad, y - rad, rad * 2, rad * 2); ctx.restore(); }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

// 울퉁불퉁한 돌 모양
function rockGeometry(seed, detail = 3, rough = 0.42) {
  const g = new THREE.IcosahedronGeometry(1, detail), p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const n = fbm3(v.x * 1.4 + seed, v.y * 1.4, v.z * 1.4 - seed, 4) - 0.5;
    const dent = Math.max(0, fbm3(v.x * 3 + seed * 2, v.y * 3, v.z * 3, 2) - 0.6) * 0.9;
    v.multiplyScalar(1 + n * rough * 2.2 - dent * 0.35);
    p.setXYZ(i, v.x, v.y, v.z);
  }
  g.computeVertexNormals();
  return g;
}

// ---- 장면
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(W, H);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
document.getElementById('stage').prepend(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(48, W / H, 0.1, 2000);

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(W, H), 0.85, 0.7, 0.8);
composer.addPass(bloom);
composer.addPass(new OutputPass());

// 배경, 성운과 별
const sky = new THREE.Mesh(new THREE.SphereGeometry(900, 48, 24),
  new THREE.MeshBasicMaterial({ map: nebulaTexture(), side: THREE.BackSide, depthWrite: false }));
scene.add(sky);
{
  const r = rng(3), n = 5200, pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const u = r() * 2 - 1, a = r() * Math.PI * 2, s = Math.sqrt(1 - u * u), d = 700;
    pos.set([s * Math.cos(a) * d, u * d, s * Math.sin(a) * d], i * 3);
    const b = 0.35 + r() * r() * 1.4, warm = r();
    col.set([b * (warm > 0.8 ? 1 : 0.85), b * 0.92, b * (warm < 0.2 ? 1.15 : 0.95)], i * 3);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  scene.add(new THREE.Points(g, new THREE.PointsMaterial({ size: 1.7, sizeAttenuation: false, vertexColors: true, depthWrite: false })));
}

// 빛, 해는 오른쪽 위 앞에서
const SUN_DIR = V(0.75, 0.35, 0.55).normalize();
const sun = new THREE.DirectionalLight(0xfff2dc, 3.2);
sun.position.copy(SUN_DIR).multiplyScalar(100);
scene.add(sun);
scene.add(new THREE.AmbientLight(0x38466e, 0.55));
const redLight = new THREE.PointLight(0xff5a2a, 0, 0, 1.6);
scene.add(redLight);

// 지구
const EARTH_R = 10;
const tex = earthTextures();
const earth = new THREE.Group();
const earthBall = new THREE.Mesh(new THREE.SphereGeometry(EARTH_R, 96, 64), new THREE.MeshStandardMaterial({
  map: tex.map, roughness: 0.85, metalness: 0, emissiveMap: tex.lights, emissive: 0xffffff, emissiveIntensity: 0.5 }));
const cloudBall = new THREE.Mesh(new THREE.SphereGeometry(EARTH_R * 1.012, 96, 64),
  new THREE.MeshStandardMaterial({ map: tex.clouds, transparent: true, roughness: 1, depthWrite: false }));
const air = new THREE.Mesh(new THREE.SphereGeometry(EARTH_R * 1.09, 64, 48), new THREE.ShaderMaterial({
  uniforms: { sunDir: { value: SUN_DIR }, tint: { value: new THREE.Color(0x4aa8ff) } },
  vertexShader: `varying vec3 vN; varying vec3 vP;
    void main(){ vN = normalize(mat3(modelMatrix) * normal); vec4 w = modelMatrix * vec4(position,1.0); vP = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`,
  fragmentShader: `uniform vec3 sunDir; uniform vec3 tint; varying vec3 vN; varying vec3 vP;
    void main(){ vec3 v = normalize(cameraPosition - vP); float rim = pow(clamp(0.78 + dot(vN, v), 0.0, 1.0), 3.2);
      float day = clamp(dot(-vN, sunDir) * 0.5 + 0.65, 0.15, 1.0); gl_FragColor = vec4(tint * rim * day * 2.2, rim); }`,
  side: THREE.BackSide, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
earth.add(earthBall, cloudBall, air);
earth.rotation.z = 0.25;
scene.add(earth);

// 방어 위성, 지구 둘레 고리
const sats = [];
{
  const body = new THREE.BoxGeometry(0.34, 0.34, 0.34), panel = new THREE.BoxGeometry(0.9, 0.04, 0.36);
  const gold = new THREE.MeshStandardMaterial({ color: 0xc9a24a, roughness: 0.4, metalness: 0.8 });
  const blue = new THREE.MeshStandardMaterial({ color: 0x1d4fb0, roughness: 0.3, metalness: 0.6 });
  for (let i = 0; i < 14; i++) {
    const g = new THREE.Group(), lamp = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 8), new THREE.MeshBasicMaterial({ color: 0x7dff9a }));
    const p1 = new THREE.Mesh(panel, blue), p2 = new THREE.Mesh(panel, blue);
    p1.position.x = -0.66; p2.position.x = 0.66; lamp.position.y = 0.3;
    g.add(new THREE.Mesh(body, gold), p1, p2, lamp);
    g.scale.setScalar(2.2);
    scene.add(g);
    sats.push({ g, lamp, a: (i / 14) * Math.PI * 2, off: hash3(i, 2, 5) });
  }
}

// 달과 포탑
const MOON_R = 2.3;
const moon = new THREE.Group();
moon.add(new THREE.Mesh(new THREE.SphereGeometry(MOON_R, 64, 48), new THREE.MeshStandardMaterial({ map: moonTexture(), roughness: 0.95 })));
const metal = new THREE.MeshStandardMaterial({ color: 0x5a5d78, roughness: 0.45, metalness: 0.75 });
const dark = new THREE.MeshStandardMaterial({ color: 0x23253a, roughness: 0.6, metalness: 0.6 });
const cyanMat = new THREE.MeshBasicMaterial({ color: 0x6ff0ff });
const turret = new THREE.Group();
{
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.95, 0.28, 20), dark);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, 0.5, 14), metal);
  neck.position.y = 0.36;
  turret.add(foot, neck);
}
const turretHead = new THREE.Group();
{
  const shell = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.6, 1.25), metal);
  const strip = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.07, 0.9), cyanMat);
  strip.position.y = -0.12;
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 1.02, 16), dark);
  hub.rotation.z = Math.PI / 2;
  turretHead.add(shell, strip, hub);
  for (const x of [-0.22, 0.22]) {
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.1, 1.9, 10), metal);
    barrel.rotation.x = Math.PI / 2; barrel.position.set(x, 0.05, 1.5);
    const brake = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.3, 10), dark);
    brake.rotation.x = Math.PI / 2; brake.position.set(x, 0.05, 2.4);
    const coil = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.5, 10), cyanMat);
    coil.rotation.x = Math.PI / 2; coil.position.set(x, 0.05, 0.9);
    turretHead.add(barrel, brake, coil);
  }
  turretHead.position.y = 0.85;
  turret.add(turretHead);
}
turret.scale.setScalar(1.7);
moon.add(turret);
scene.add(moon);

// 궤도 선, 게임의 노란 점선처럼
const ORBIT_R = 26;
const orbit = new THREE.Group();
for (let i = 0; i < 72; i++) {
  if (i % 2) continue;
  const a = (i / 72) * Math.PI * 2, dot = new THREE.Mesh(new THREE.SphereGeometry(0.16, 6, 6), new THREE.MeshBasicMaterial({ color: 0xffd27a }));
  dot.position.set(Math.cos(a) * ORBIT_R, 0, Math.sin(a) * ORBIT_R);
  orbit.add(dot);
}
scene.add(orbit);

// 소행성
const rockGeos = [0, 1, 2, 3, 4, 5].map((i) => rockGeometry(i * 3.7 + 1, 3));
const rockMats = [0x6e5a58, 0x7d675c, 0x5a4a52, 0x8a7060].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.95, flatShading: true }));
function makeRocks(n, seed) {
  const r = rng(seed), out = [];
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(rockGeos[i % rockGeos.length], rockMats[i % rockMats.length]);
    m.visible = false;
    scene.add(m);
    out.push({ m, r: [r(), r(), r(), r(), r(), r(), r(), r()] });
  }
  return out;
}
const swarm = makeRocks(110, 11);
const targets = makeRocks(9, 23);
const drifters = makeRocks(14, 31);

// 포탄, 폭발
const bolts = [], blasts = [];
for (let i = 0; i < targets.length; i++) {
  const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 1, 8), new THREE.MeshBasicMaterial({ color: 0xfff0b0 }));
  bolt.visible = false;
  scene.add(bolt);
  bolts.push(bolt);
  const r = rng(100 + i), n = 90, dirs = [], pos = new Float32Array(n * 3);
  for (let k = 0; k < n; k++) {
    const u = r() * 2 - 1, a = r() * Math.PI * 2, s = Math.sqrt(1 - u * u);
    dirs.push([s * Math.cos(a), u, s * Math.sin(a), 4 + r() * 12]);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffb060, size: 0.28, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  const ball = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), new THREE.MeshBasicMaterial({ color: 0xffe2a0, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  const chunks = [0, 1, 2, 3, 4].map((k) => { const c = new THREE.Mesh(rockGeos[k], rockMats[k % 4]); scene.add(c); c.visible = false; return c; });
  pts.visible = ball.visible = false;
  pts.frustumCulled = false;
  scene.add(pts, ball);
  blasts.push({ pts, ball, dirs, chunks });
}
const blastLight = new THREE.PointLight(0xffb060, 0, 60, 1.8);
scene.add(blastLight);

// 보스, 갈라진 틈에서 마그마가 빛나는 거대한 돌
const BOSS_R = 15;
const boss = new THREE.Mesh(rockGeometry(40, 6, 0.3), new THREE.ShaderMaterial({
  uniforms: { sunDir: { value: SUN_DIR }, heat: { value: 0 }, time: { value: 0 } },
  vertexShader: `varying vec3 vN; varying vec3 vO;
    void main(){ vN = normalize(mat3(modelMatrix) * normal); vO = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
  fragmentShader: `uniform vec3 sunDir; uniform float heat; uniform float time; varying vec3 vN; varying vec3 vO;
    float h(vec3 p){ return fract(sin(dot(p, vec3(127.1,311.7,74.7))) * 43758.5453); }
    float n3(vec3 p){ vec3 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
      return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x), mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x), f.y),
                 mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x), mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x), f.y), f.z); }
    float fbm(vec3 p){ float s = 0.0, a = 0.5; for(int i=0;i<5;i++){ s += n3(p)*a; p *= 2.03; a *= 0.5; } return s; }
    void main(){
      float lit = clamp(dot(vN, sunDir), 0.0, 1.0) * 0.9 + 0.06;
      vec3 rock = mix(vec3(0.055,0.04,0.05), vec3(0.24,0.17,0.15), fbm(vO*2.2)) * lit;
      float v = abs(fbm(vO*1.25 + 3.0) - 0.47);
      float crack = smoothstep(0.022, 0.0, v);
      float pulse = 0.75 + 0.25 * sin(time * 5.0 + vO.y * 2.0);
      vec3 magma = mix(vec3(1.0,0.22,0.03), vec3(1.0,0.75,0.25), crack) * crack * heat * pulse * 0.7;
      gl_FragColor = vec4(rock + magma, 1.0); }`,
}));
boss.scale.setScalar(BOSS_R);
boss.visible = false;
scene.add(boss);

// ---- 장면별 움직임
const UP = V(0, 1, 0);
const moonAngle = (t) => 0.75 + 0.3 * (t - T.moon);
function moonPos(t) { const a = moonAngle(t); return V(Math.cos(a) * ORBIT_R, 0, Math.sin(a) * ORBIT_R); }
// 달 장면에서 차례로 터질 소행성: 터지는 시간과 그때의 자리
const KILLS = targets.map((o, i) => {
  const tk = T.moon + 1.5 + i * 0.58, mp = moonPos(tk), out = mp.clone().normalize(), a = moonAngle(tk);
  const tg = V(-Math.sin(a), 0, Math.cos(a)), th = -0.9 + o.r[0] * 1.9, d = 9 + o.r[1] * 7;
  const at = mp.clone().addScaledVector(out, Math.cos(th) * d).addScaledVector(tg, Math.sin(th) * d + 5).addScaledVector(UP, (o.r[2] - 0.35) * 7);
  return { tk, at, size: 0.9 + o.r[3] * 1.3 };
});
function targetPos(i, t) {
  const k = KILLS[i], dir = k.at.clone().normalize();
  return k.at.clone().addScaledVector(dir, Math.max(0, k.tk - t) * 4.5);
}

function hideAll() {
  for (const o of [...swarm, ...targets, ...drifters]) o.m.visible = false;
  for (const b of bolts) b.visible = false;
  for (const b of blasts) { b.pts.visible = b.ball.visible = false; b.chunks.forEach((c) => (c.visible = false)); }
  for (const s of sats) s.g.visible = false;
  boss.visible = false; orbit.visible = false; moon.visible = false; turret.visible = true;
  blastLight.intensity = 0; redLight.intensity = 0;
}

function spin(o, t, s = 1) { o.m.rotation.set(t * (0.4 + o.r[4]) * s, t * (0.3 + o.r[5]) * s, o.r[6] * 6); }

function update(t) {
  hideAll();
  earth.visible = true;
  earthBall.rotation.y = 0.8 + t * 0.035;
  cloudBall.rotation.y = 0.8 + t * 0.055;
  sky.rotation.y = t * 0.004;
  renderer.toneMappingExposure = 1.0;
  bloom.strength = 0.85;
  let shake = 0;

  if (t < T.swarm) {
    // 1 고요한 지구와 방어 위성, 하나씩 꺼짐
    const k = easeInOut(seg(t, 0, 5));
    camera.position.set(lerp(-14, -6, k), lerp(9, 6, k), lerp(64, 40, k));
    camera.lookAt(0, 0, 0);
    for (const s of sats) {
      s.g.visible = true;
      const a = s.a + t * 0.12;
      s.g.position.set(Math.cos(a) * 15.5, Math.sin(a * 2) * 0.6, Math.sin(a) * 15.5);
      s.g.rotation.set(0.3, -a, 0.2);
      const off = 2.5 + s.off * 1.2, age = t - off;
      if (age < 0) s.lamp.material.color.setHex(0x7dff9a);
      else if (age < 0.5) s.lamp.material.color.setHex(Math.sin(age * 50) > 0 ? 0xff4a3a : 0x220505);
      else s.lamp.material.color.setHex(0x101018);
      if (age > 0.5) s.g.rotation.x += (age - 0.5) * 0.6;
    }
  } else if (t < T.moon) {
    // 2 소행성 떼가 카메라 옆을 스쳐 지구로
    const u = t - T.swarm, C = V(-36, 11, 80).addScaledVector(V(0.4, -0.1, -0.9), u * 1.6);
    camera.position.copy(C);
    camera.lookAt(0, 0, 0);
    const f = V(0, 0, 0).sub(C).normalize(), right = V().crossVectors(f, UP).normalize(), up = V().crossVectors(right, f);
    for (const o of swarm) {
      const sp = 20 + o.r[0] * 26, s = -70 + o.r[1] * 110 + sp * u;
      let ox = (o.r[2] * 2 - 1) * 30, oy = (o.r[3] * 2 - 1) * 16;
      if (Math.abs(ox) < 4 && Math.abs(oy) < 3) ox += ox < 0 ? -5 : 5;
      // 지구 쪽으로 갈수록 모임
      const pull = clamp(s / 90) * 0.75;
      o.m.position.copy(C).addScaledVector(f, s).addScaledVector(right, ox * (1 - pull)).addScaledVector(up, oy * (1 - pull));
      o.m.scale.setScalar(0.5 + o.r[7] * o.r[7] * 2.6);
      spin(o, t, 2);
      o.m.visible = s > -30 && s < 96;
      if (o.m.visible && Math.abs(s) < 4 && o.r[7] > 0.7) shake = Math.max(shake, 0.12);
    }
  } else if (t < T.play) {
    // 3 달이 궤도를 돌며 포탑으로 소행성을 부숨
    const mp = moonPos(t), a = moonAngle(t), out = mp.clone().normalize(), tg = V(-Math.sin(a), 0, Math.cos(a));
    moon.visible = true; orbit.visible = true;
    moon.position.copy(mp);
    moon.rotation.y = -a + t * 0.05;
    const k = easeInOut(seg(t, T.moon, T.moon + 2.2));
    camera.position.copy(mp).addScaledVector(tg, lerp(-5.5, -8.0, k)).addScaledVector(UP, lerp(2.2, 3.6, k)).addScaledVector(out, lerp(-2.0, -3.5, k));
    camera.lookAt(mp.clone().addScaledVector(tg, 6).addScaledVector(out, 4).addScaledVector(UP, -0.4));

    // 지금 겨누는 소행성
    let next = KILLS.findIndex((kk) => kk.tk > t - 0.04);
    if (next < 0) next = KILLS.length - 1;
    const prev = Math.max(0, next - 1);
    const turn = next === 0 ? 1 : easeInOut(seg(t, KILLS[prev].tk + 0.04, KILLS[prev].tk + 0.34));
    const aimAt = KILLS[prev].at.clone().lerp(targetPos(next, t), turn);
    // 포탑은 달의 바깥 위쪽에 서 있음
    const seat = out.clone().multiplyScalar(0.55).addScaledVector(UP, 0.8).addScaledVector(tg, 0.2).normalize();
    turret.position.copy(seat).multiplyScalar(MOON_R - 0.08);
    turret.quaternion.setFromUnitVectors(UP, seat);
    turret.applyQuaternion(moon.quaternion.clone().invert());
    turret.position.applyQuaternion(moon.quaternion.clone().invert());
    turretHead.lookAt(aimAt);
    const muzzle = turretHead.getWorldPosition(V()).add(aimAt.clone().sub(turretHead.getWorldPosition(V())).normalize().multiplyScalar(4.2));

    KILLS.forEach((kk, i) => {
      const age = t - kk.tk, o = targets[i], b = blasts[i];
      if (age < 0) {
        o.m.visible = true;
        o.m.position.copy(targetPos(i, t));
        o.m.scale.setScalar(kk.size);
        spin(o, t, 1.5);
        const fly = seg(t, kk.tk - 0.16, kk.tk);
        if (fly > 0) {
          const from = muzzle, to = kk.at, p = from.clone().lerp(to, fly), bolt = bolts[i];
          bolt.visible = true;
          bolt.position.copy(p);
          bolt.scale.set(1, Math.min(3.2, from.distanceTo(to) * 0.4), 1);
          bolt.quaternion.setFromUnitVectors(UP, to.clone().sub(from).normalize());
        }
        return;
      }
      if (age > 1.6) return;
      // 터짐: 밝은 공, 불티, 돌 조각
      const fade = 1 - age / 1.6;
      b.ball.visible = age < 0.35;
      b.ball.position.copy(kk.at);
      b.ball.scale.setScalar(kk.size * (0.3 + easeOut(seg(age, 0, 0.35)) * 0.9));
      b.ball.material.opacity = 0.5 * (1 - seg(age, 0, 0.35));
      b.pts.visible = true;
      const pos = b.pts.geometry.attributes.position;
      b.dirs.forEach((d, j) => { const s = d[3] * age * (1 - age * 0.25); pos.setXYZ(j, kk.at.x + d[0] * s, kk.at.y + d[1] * s, kk.at.z + d[2] * s); });
      pos.needsUpdate = true;
      b.pts.material.opacity = fade;
      b.pts.material.size = 0.3 * fade + 0.05;
      b.chunks.forEach((c, j) => {
        const d = b.dirs[j * 7];
        c.visible = true;
        c.position.copy(kk.at).add(V(d[0], d[1], d[2]).multiplyScalar(d[3] * 0.45 * age));
        c.scale.setScalar(kk.size * 0.34 * fade);
        c.rotation.set(age * 5 + j, age * 4, j);
      });
      if (age < 0.4) {
        blastLight.position.copy(kk.at);
        blastLight.intensity = 120 * (1 - age / 0.4);
        shake = Math.max(shake, 0.07 * (1 - age / 0.4));
      }
    });
  } else if (t < T.boss) {
    // 4 실제 게임 화면이 나오는 동안 뒤에는 천천히 도는 지구
    const a = 0.4 + (t - T.play) * 0.03;
    camera.position.set(Math.sin(a) * 46, 10, Math.cos(a) * 46);
    camera.lookAt(17, 0, 0);
    renderer.toneMappingExposure = 0.42;
    orbit.visible = true; moon.visible = true;
    moon.position.copy(moonPos(t));
  } else if (t < T.logo) {
    // 5 거대 소행성이 지구 위로 내려옴
    const u = seg(t, T.boss, T.logo), k = easeOut(u);
    camera.position.set(lerp(6, 2, k), lerp(-9, -7, k), lerp(52, 44, k));
    camera.lookAt(0, 9, 0);
    boss.visible = true;
    bloom.strength = 0.45;
    boss.position.set(3, lerp(46, 28, k), -6);
    boss.rotation.set(0.3 + t * 0.05, t * 0.08, 0.2);
    boss.material.uniforms.heat.value = easeInOut(seg(t, T.boss + 0.9, T.boss + 1.9));
    boss.material.uniforms.time.value = t;
    redLight.position.set(3, lerp(34, 16, k), 4);
    redLight.intensity = 220 * boss.material.uniforms.heat.value;
    shake = 0.05 + 0.25 * seg(t, T.boss + 1.2, T.logo);
    for (const o of drifters) {
      const fall = (t - T.boss) * (6 + o.r[0] * 8);
      o.m.visible = boss.material.uniforms.heat.value > 0.3;
      o.m.position.set(3 + (o.r[1] * 2 - 1) * 16, 18 - fall + o.r[2] * 10, -4 + (o.r[3] * 2 - 1) * 10);
      o.m.scale.setScalar(0.3 + o.r[7] * 0.7);
      spin(o, t, 3);
    }
  } else {
    // 6 로고 뒤로 궤도를 도는 달과 지구
    const u = t - T.logo;
    camera.position.set(lerp(-10, -4, seg(u, 0, 4)), 15, lerp(62, 56, seg(u, 0, 4)));
    camera.lookAt(-16, 9, 0);
    renderer.toneMappingExposure = 0.5;
    orbit.visible = true; moon.visible = true;
    const mp = moonPos(T.moon + 14 + u * 1.2);
    moon.position.copy(mp);
    turret.position.set(0, MOON_R - 0.05, 0);
    turret.quaternion.identity();
    turretHead.rotation.set(-0.5, u * 0.6, 0);
    const slam = u < 0.5 ? 1 - u / 0.5 : 0;
    shake = 0.5 * slam;
  }

  if (shake > 0) {
    camera.position.x += Math.sin(t * 97) * shake;
    camera.position.y += Math.cos(t * 83) * shake;
  }
}

// ---- 글자와 게임 화면, 화면 위에 덧씌우는 부분
const $ = (id) => document.getElementById(id);
function showCap(el, text, t, t0, t1) {
  const k = seg(t, t0, t0 + 0.35) * (1 - seg(t, t1 - 0.35, t1));
  if (k > 0 && el.dataset.text !== text) { el.textContent = text; el.dataset.text = text; }
  return k;
}
function caps(el, list, t) {
  let best = 0, move = 0;
  for (const [text, t0, t1] of list) {
    const k = showCap(el, text, t, t0, t1);
    if (k > best) { best = k; move = (1 - seg(t, t0, t0 + 0.35)) * 14; }
  }
  el.style.opacity = best.toFixed(3);
  el.style.transform = `translateY(${move.toFixed(1)}px)`;
}

// 게임 화면 조각: 시작, 끝, 조각 이름, 첫 프레임, 번호, 제목, 설명
const CLIPS = [
  [16.5, 19.2, 'a', 4, '01', '속도가 곧 궤도', '가속하면 궤도가 넓어지고<br>감속하면 좁아진다'],
  [19.2, 22.2, 'b', 20, '02', '달에 주렁주렁', '증강 12종<br>매달수록 강해지고<br>그만큼 무거워진다'],
  [22.2, 24.6, 'd', 8, '03', '스킬 컷인', 'Q W E 로 터뜨리는<br>네 가지 스킬'],
  [24.6, 26.5, 'f', 20, '04', '거대 소행성', '웨이브 10<br>보스를 부숴라'],
];
const frameCount = { a: 90, b: 120, d: 126, f: 90 };
const play = $('play');
async function setPlayFrame(t) {
  const c = CLIPS.find((x) => t >= x[0] && t < x[1]);
  if (!c) return null;
  const idx = Math.min(frameCount[c[2]] - 1, c[3] + Math.floor((t - c[0]) * FPS));
  const src = `/play/${c[2]}_${String(idx).padStart(3, '0')}.jpg`;
  if (play.dataset.src !== src) {
    play.dataset.src = src;
    play.src = src;
    await play.decode();
  }
  return c;
}

async function overlay(t) {
  caps($('year'), [['2187', 0.7, 2.6]], t);
  caps($('cap1'), [
    ['방어 위성이 모두 꺼졌다', 2.9, 4.9],
    ['소행성이 몰려온다', 5.8, 9.6],
    ['남은 건 달 하나', 10.5, 13.2],
    ['달을 움직여 지구를 지켜라', 13.6, 16.3],
    ['거대 소행성 접근', 27.0, 28.9],
  ], t);
  caps($('cap2'), [['WAVE 10', 27.2, 28.9]], t);

  // 게임 화면 창
  const c = await setPlayFrame(t), on = seg(t, T.play, T.play + 0.4) * (1 - seg(t, T.boss - 0.3, T.boss));
  $('panel').style.opacity = on.toFixed(3);
  $('tag').style.opacity = on.toFixed(3);
  $('side').style.opacity = on.toFixed(3);
  if (c) {
    const u = t - c[0], pop = 1 + 0.035 * (1 - easeOut(seg(u, 0, 0.25)));
    $('panel').style.transform = `perspective(1400px) rotateY(${(5 - u * 0.5).toFixed(2)}deg) scale(${pop.toFixed(4)})`;
    if ($('side').dataset.no !== c[4]) {
      $('side').dataset.no = c[4];
      $('sideNo').textContent = c[4];
      $('sideTitle').textContent = c[5];
      $('sideText').innerHTML = c[6];
    }
    const sk = easeOut(seg(u, 0.05, 0.4));
    $('sideTitle').style.transform = `translateX(${((1 - sk) * 40).toFixed(1)}px)`;
    $('sideTitle').style.opacity = sk.toFixed(3);
    $('sideText').style.opacity = easeOut(seg(u, 0.25, 0.6)).toFixed(3);
  }

  // 번쩍임: 게임 화면이 바뀔 때와 로고가 뜰 때
  let flash = 0;
  for (const x of CLIPS) flash = Math.max(flash, 0.55 * (1 - seg(t, x[0], x[0] + 0.14)) * (t >= x[0] ? 1 : 0));
  flash = Math.max(flash, (t >= T.logo ? 1 : 0) * (1 - seg(t, T.logo, T.logo + 0.3)));
  flash = Math.max(flash, 0.7 * seg(t, T.logo - 0.12, T.logo) * (t < T.logo ? 1 : 0));
  $('flash').style.opacity = flash.toFixed(3);

  // 로고
  const u = t - T.logo, logo = $('logo');
  if (u >= 0) {
    const k = easeOut(seg(u, 0, 0.28)), f = Math.floor(u * 12) % 36;
    logo.style.opacity = '1';
    logo.style.backgroundPosition = `-${(f % 5) * 220}px -${Math.floor(f / 5) * 110}px`;
    logo.style.transform = `scale(${(lerp(7.0, 3.5, k)).toFixed(3)})`;
  } else logo.style.opacity = '0';
  $('tagline').style.opacity = (seg(u, 1.0, 1.4)).toFixed(3);
  $('tagline').style.transform = `translateY(${((1 - easeOut(seg(u, 1.0, 1.4))) * 16).toFixed(1)}px)`;
  $('credit').style.opacity = (seg(u, 1.7, 2.1)).toFixed(3);

  // 처음과 끝은 검은 화면에서
  $('black').style.opacity = Math.max(1 - seg(t, 0.1, 0.9), seg(t, DUR - 0.7, DUR - 0.1)).toFixed(3);
}

window.FPS = FPS;
window.FRAMES = Math.round(DUR * FPS);
window.renderFrame = async (f) => {
  const t = f / FPS;
  update(t);
  composer.render();
  await overlay(t);
  return true;
};

await document.fonts.load('700 40px Galmuri11');
await document.fonts.load('20px Galmuri14');
await window.renderFrame(0);
window.ready = true;
// 주소 끝에 ?t=초 를 붙이면 그 시간의 한 장을, ?play 를 붙이면 실시간으로 보여 줌
const q = new URLSearchParams(location.search);
if (q.has('t')) await window.renderFrame(Math.round(parseFloat(q.get('t')) * FPS));
if (q.has('play')) {
  const start = performance.now();
  const tick = async () => { await window.renderFrame(Math.floor(((performance.now() - start) / 1000 * FPS) % window.FRAMES)); requestAnimationFrame(tick); };
  tick();
}
