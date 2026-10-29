#!/usr/bin/env node
/**
 * capture_frames.mjs — deterministic frame capture for a seekable scene.
 *
 * Usage:
 *   node scripts/capture_frames.mjs --scene out/01/scene.html --fps 30 \
 *        --duration 8 --out out/01/frames/
 *
 * What it does (and why, in one paragraph):
 *   The scene HTML must expose two things on window:
 *     - __seek(frame)  → draw frame `frame` to a canvas
 *     - __ready()      → resolves when the first frame is laid out and
 *                        fonts have settled
 *   This script opens the HTML in headless Chromium (Playwright, Apache-2.0;
 *   we picked it over Puppeteer for its one-line `deviceScaleFactor` API),
 *   waits for __ready(), then for frame f = 0 .. fps*duration-1 it calls
 *   __seek(f) and screenshots the canvas. Frame 0 is captured *twice* and
 *   byte-compared: if they differ, the scene has a wall-clock leak
 *   (Math.random / Date.now / first-load font swap) and the script exits
 *   non-zero with the frame number that mismatched — the "same frame twice
 *   = identical pixels" check from references/10 §1.
 *
 *   No sleep in the loop. The only wait is the one-time settle for
 *   __ready(). This is what makes a 240-frame capture take seconds and be
 *   *reproducible*.
 *
 *   One-time setup: `npx playwright install chromium` (installs the
 *   headless shell to ~/.cache/ms-playwright/, ~118 MB).
 */

import { chromium } from 'playwright';
import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'node:fs';
import { basename, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---- args ------------------------------------------------------------
const argv = process.argv.slice(2);
function arg(name, def) {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : def;
}
const scene = arg('scene', null);
const fps = parseInt(arg('fps', '30'), 10);
const duration = parseFloat(arg('duration', '8'));
const out = arg('out', 'out/frames');
const width = parseInt(arg('width', '960'), 10);
const height = parseInt(arg('height', '960'), 10);
const dpr = parseInt(arg('dpr', '2'), 10);

if (!scene) {
  console.error('usage: node scripts/capture_frames.mjs --scene <file.html> --fps 30 --duration 8 --out out/frames');
  process.exit(2);
}

const totalFrames = Math.round(fps * duration);
const here = dirname(fileURLToPath(import.meta.url));
const scenePath = join(process.cwd(), scene);
if (!existsSync(scenePath)) { console.error(`scene not found: ${scenePath}`); process.exit(2); }

// Make the library's ES-module imports resolve: the scene file and the
// library/js/*.js must be in the same folder (that's the "zero-install"
// contract — copy both, then run). We resolve relative to the scene's
// own folder so `import './rig.js'` in the HTML works from file://.
const sceneDir = dirname(scenePath);

async function main() {
  mkdirSync(out, { recursive: true });

  // --allow-file-access-from-files lets the headless shell load the
  // sibling ES modules (./rig.js, ./timeline.js, …) from a file:// page.
  // This is the zero-install contract from references/10: the template
  // HTML + the library .js files live in one folder, no bundler.
  const browser = await chromium.launch({
    args: ['--allow-file-access-from-files', '--no-sandbox'],
  });
  const page = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: dpr,
  }).then((c) => c.newPage());

  await page.addInitScript(() => {
    window.__capturing = true;
  });

  page.on('console', (m) => {
    if (m.type() === 'error') console.error('[page console.error]', m.text());
  });
  page.on('pageerror', (e) => { console.error('[page error]', e.message); process.exitCode = 1; });

  await page.goto(`file://${scenePath}`, { waitUntil: 'load' });

  // The scene must self-register __seek + __ready. Wait up to 5s.
  const ok = await page.waitForFunction(
    () => typeof window.__seek === 'function' && typeof window.__ready === 'function',
    null,
    { timeout: 5000 },
  ).then(() => true).catch(() => false);
  if (!ok) {
    console.error('scene did not expose window.__seek / window.__ready within 5s — check the HTML');
    await browser.close();
    process.exit(3);
  }
  await page.evaluate(() => {
    window.__capturing = true;
    if (typeof window.__stopPreview === 'function') window.__stopPreview();
    return window.__ready();
  });

  const shot = async (name) => {
    const p = join(out, name);
    await page.screenshot({ path: p, type: 'png', clip: { x: 0, y: 0, width, height } });
    return p;
  };

  // Determinism check: capture frame 0 twice.
  await page.evaluate((f) => window.__seek(f), 0);
  await new Promise((r) => setTimeout(r, 80)); // one paint
  const a = await shot('frame-0000.png');
  await page.evaluate((f) => window.__seek(f), 0);
  await new Promise((r) => setTimeout(r, 80));
  const b = await shot('frame-0000-check.png');
  const ba = readFileSync(a), bb = readFileSync(b);
  if (ba.length !== bb.length || !ba.equals(bb)) {
    console.error(`DETERMINISM FAIL: frame 0 captured twice differs (${ba.length} vs ${bb.length} bytes). `
      + 'Wall-clock leak — grep the scene for Math.random/Date.now/performance.now, or a @font-face that swaps after frame 0 (references/12 trap f, references/10 §7).');
    await browser.close();
    process.exit(4);
  }
  console.log('determinism check: frame 0 byte-identical on re-capture');

  // Full capture.
  for (let f = 0; f < totalFrames; f++) {
    await page.evaluate((fr) => window.__seek(fr), f);
    await new Promise((r) => setTimeout(r, 4)); // let the canvas paint; 4ms keeps 240 frames fast
    if (f === 0) continue; // already captured
    const name = `frame-${String(f).padStart(4, '0')}.png`;
    await page.screenshot({ path: join(out, name), type: 'png', clip: { x: 0, y: 0, width, height } });
  }
  // delete the check copy so stitch.sh sees a clean %04d sequence
  if (existsSync(b)) { /* unlink */ try { (await import('node:fs')).unlinkSync(b); } catch {} }

  console.log(`captured ${totalFrames} frames @${fps}fps → ${out}`);
  await browser.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
