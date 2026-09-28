// Render index.html frame-by-frame with headless Chromium (DOM + canvas grain), then mux with the soundtrack.
//   node render.mjs stills 0.8 2.6 4.2      -> PNG stills in $OUT/stills
//   node render.mjs sheet                    -> contact sheet frames (every 0.25 s) in $OUT/sheet
//   node render.mjs video                    -> out/rsc-ad-15s.mp4 (30 fps, Instagram-ready)
import { createRequire } from 'module';
import { spawn } from 'child_process';
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node22/lib/node_modules/playwright');
const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const FPS = 60, DUR = 15, W = 1080, H = 1920;
const OUT = process.env.OUT || path.join(here, 'out');
const FFMPEG = process.env.FFMPEG || 'ffmpeg';
const WORKERS = +(process.env.WORKERS || 4);

const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png',
  '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.wav': 'audio/wav' };
const server = http.createServer((req, res) => {
  const p = path.join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!p.startsWith(root) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(p)] || 'application/octet-stream' });
  fs.createReadStream(p).pipe(res);
});
await new Promise(r => server.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${server.address().port}/motion/ad/index.html?render`;

const browser = await chromium.launch({ args: ['--force-color-profile=srgb', '--font-render-hinting=none', '--disable-lcd-text',
  '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
async function openPage() {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('pageerror', e.message));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.error('console', m.text()); });
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => window.ready);
  return page;
}
async function shot(page, t, file, type = 'png') {
  await page.evaluate(t => window.seek(t), t);
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  await page.screenshot({ path: file, type, ...(type === 'jpeg' ? { quality: 97 } : {}) });
}
const ff = a => new Promise((res, rej) => spawn(FFMPEG, a, { stdio: 'inherit' }).on('exit', c => c ? rej(new Error('ffmpeg ' + c)) : res()));

const mode = process.argv[2];
if (mode === 'stills') {
  const dir = path.join(OUT, 'stills'); fs.mkdirSync(dir, { recursive: true });
  const page = await openPage();
  for (const t of process.argv.slice(3).map(Number)) {
    const f = path.join(dir, `t${t.toFixed(3)}.png`); await shot(page, t, f); console.log(f);
  }
} else if (mode === 'sheet') {
  const dir = path.join(OUT, 'sheet'); fs.mkdirSync(dir, { recursive: true });
  const step = +(process.argv[3] || .25), from = +(process.argv[4] || 0), to = +(process.argv[5] || DUR);
  const ts = []; for (let t = from; t < to - 1e-6; t += step) ts.push(+t.toFixed(4));
  let i = 0;
  await Promise.all(Array.from({ length: WORKERS }, async () => {
    const page = await openPage();
    while (i < ts.length) { const t = ts[i++]; await shot(page, t, path.join(dir, `s${t.toFixed(3).padStart(7, '0')}.jpg`), 'jpeg'); }
  }));
  console.log(ts.length, 'frames ->', dir);
} else if (mode === 'video') {
  const frames = path.join(OUT, 'frames'); fs.mkdirSync(frames, { recursive: true });
  const N = FPS * DUR; let done = 0; const t0 = Date.now();
  await Promise.all(Array.from({ length: WORKERS }, async (_, w) => {
    const page = await openPage();
    for (let f = w; f < N; f += WORKERS) {
      await shot(page, f / FPS, path.join(frames, `f${String(f).padStart(4, '0')}.jpg`), 'jpeg');
      if (++done % 60 === 0) console.log(`${done}/${N} frames  ${((Date.now() - t0) / 1000).toFixed(0)}s`);
    }
  }));
  // one Instagram-ready file: 30 fps (the film is slow; 60 fps adds nothing), grain kept by a CRF 19 cap at 16 Mb/s
  const mp4 = path.join(here, 'out', 'rsc-ad-15s.mp4');
  await ff(['-y', '-framerate', String(FPS), '-i', path.join(frames, 'f%04d.jpg'), '-i', path.join(here, 'out', 'soundtrack.wav'),
    '-vf', 'fps=30', '-c:v', 'libx264', '-preset', 'slow', '-crf', '19', '-maxrate', '16M', '-bufsize', '32M', '-pix_fmt', 'yuv420p',
    '-profile:v', 'high', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-t', String(DUR), '-movflags', '+faststart', mp4]);
  console.log(mp4);
}
await browser.close(); server.close();
