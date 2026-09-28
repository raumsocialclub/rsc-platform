// Render index.html frame-by-frame with headless Chromium, then mux with the soundtrack.
//   node render.mjs stills 0.8 2.6 4.2      -> PNG stills in $OUT/stills
//   node render.mjs video                    -> out/rsc-showreel-15s.mp4
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
const FPS = 60, DUR = 15, W = 1920, H = 1080;
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
const url = `http://127.0.0.1:${server.address().port}/motion/showreel/index.html?render`;

const browser = await chromium.launch({ args: ['--force-color-profile=srgb', '--font-render-hinting=none', '--disable-lcd-text'] });
async function openPage() {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.error('pageerror', e.message));
  await page.goto(url, { waitUntil: 'networkidle' });
  await page.evaluate(() => window.ready);
  return page;
}
async function shot(page, t, file, type = 'png') {
  await page.evaluate(t => window.seek(t), t);
  await page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  await page.screenshot({ path: file, type, ...(type === 'jpeg' ? { quality: 97 } : {}) });
}

const mode = process.argv[2];
if (mode === 'stills') {
  const dir = path.join(OUT, 'stills'); fs.mkdirSync(dir, { recursive: true });
  const page = await openPage();
  for (const t of process.argv.slice(3).map(Number)) {
    const f = path.join(dir, `t${t.toFixed(2)}.png`); await shot(page, t, f); console.log(f);
  }
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
  const mp4 = path.join(here, 'out', 'rsc-showreel-15s.mp4');
  const args = ['-y', '-framerate', String(FPS), '-i', path.join(frames, 'f%04d.jpg'), '-i', path.join(here, 'out', 'soundtrack.wav'),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-tune', 'film',
    '-c:a', 'aac', '-b:a', '256k', '-t', String(DUR), '-movflags', '+faststart', mp4];
  const ff = a => new Promise((res, rej) => spawn(FFMPEG, a, { stdio: 'inherit' }).on('exit', c => c ? rej(new Error('ffmpeg ' + c)) : res()));
  await ff(args);
  // lighter copy for messengers / web embeds
  const web = mp4.replace('.mp4', '-web.mp4');
  await ff(['-y', '-i', mp4, '-c:v', 'libx264', '-preset', 'slow', '-crf', '23', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
    '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', web]);
  console.log(mp4, web);
}
await browser.close(); server.close();
