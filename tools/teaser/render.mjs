// 달지기 티저를 mp4로 찍는 스크립트
// node render.mjs 게임화면폴더 결과.mp4          전체를 찍어 영상으로
// node render.mjs 게임화면폴더 --stills 폴더 1 6 12   그 시간들만 한 장씩 png로
// 크롬을 화면 없이 띄워 한 프레임씩 그리고 찍어서 ffmpeg로 넘김
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..', '..');
const [playDir, ...rest] = process.argv.slice(2);
if (!playDir) throw new Error('게임 화면 폴더를 먼저 적어야 함, record_gameplay.py 로 만든 폴더');

const CHROME = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe']
  .find((p) => fs.existsSync(p));
const FFMPEG = process.env.FFMPEG || 'ffmpeg';

// 주소 앞부분마다 읽어 줄 폴더
const roots = { '/res/': path.join(repo, 'res'), '/play/': path.resolve(playDir), '/three/': path.join(here, 'node_modules', 'three'), '/': here };
const types = { '.html': 'text/html', '.js': 'text/javascript', '.png': 'image/png', '.jpg': 'image/jpeg', '.ttf': 'font/ttf', '.json': 'application/json' };
const server = http.createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const prefix = Object.keys(roots).find((p) => url.startsWith(p));
  const file = path.join(roots[prefix], url.slice(prefix.length) || 'index.html');
  if (!file.startsWith(roots[prefix]) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); res.end(); return; }
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const base = `http://127.0.0.1:${server.address().port}/`;

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: true,
  args: ['--use-angle=d3d11', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-webgl', '--hide-scrollbars', '--force-device-scale-factor=1'],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
page.on('pageerror', (e) => console.error('page error:', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.error('console:', m.text()); });
await page.goto(base, { waitUntil: 'load' });
await page.waitForFunction('window.ready === true', { timeout: 120000 });
const { FPS, FRAMES } = await page.evaluate(() => ({ FPS: window.FPS, FRAMES: window.FRAMES }));
const clip = { x: 0, y: 0, width: 1280, height: 720 };

if (rest[0] === '--stills') {
  const out = path.resolve(rest[1]);
  fs.mkdirSync(out, { recursive: true });
  for (const s of rest.slice(2)) {
    await page.evaluate((f) => window.renderFrame(f), Math.round(parseFloat(s) * FPS));
    await page.screenshot({ path: path.join(out, `t${String(s).padStart(5, '0')}.png`), clip });
  }
  console.log('stills saved to', out);
} else {
  const out = path.resolve(rest[0] || 'teaser.mp4');
  const ff = spawn(FFMPEG, ['-y', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'mjpeg', '-i', '-',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '15', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise((ok, no) => ff.on('close', (c) => (c === 0 ? ok() : no(new Error('ffmpeg exit ' + c)))));
  for (let f = 0; f < FRAMES; f++) {
    await page.evaluate((n) => window.renderFrame(n), f);
    const shot = await page.screenshot({ type: 'jpeg', quality: 97, clip });
    if (!ff.stdin.write(shot)) await new Promise((ok) => ff.stdin.once('drain', ok));
    if (f % 60 === 0) console.log(`frame ${f} / ${FRAMES}`);
  }
  ff.stdin.end();
  await done;
  console.log('video saved to', out);
}
await browser.close();
server.close();
