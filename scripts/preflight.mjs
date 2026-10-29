#!/usr/bin/env node
/**
 * preflight.mjs — check environment prerequisites and print fixes
 * Usage:
 *   node scripts/preflight.mjs
 */

import { spawnSync } from 'node:child_process';

let pass = 0, fail = 0;

function check(name, testFn, fix) {
  process.stdout.write(`Checking ${name.padEnd(25)} ... `);
  try {
    if (testFn()) {
      console.log('OK');
      pass++;
    } else {
      console.log('MISSING');
      console.log(`  -> Fix: ${fix}`);
      fail++;
    }
  } catch (e) {
    console.log('MISSING');
    console.log(`  -> Fix: ${fix}`);
    fail++;
  }
}

console.log('=== Animation Skill Preflight Check ===');

// 1. Node.js
check('Node.js (>= 18)', () => {
  const v = parseInt(process.versions.node, 10);
  return v >= 18;
}, 'Install Node.js 18+ from https://nodejs.org/');

// 2. ffmpeg
check('ffmpeg', () => {
  const r = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' });
  return r.status === 0;
}, 'Install ffmpeg and add it to PATH');

// 3. ffprobe
check('ffprobe', () => {
  const r = spawnSync('ffprobe', ['-version'], { encoding: 'utf8' });
  return r.status === 0;
}, 'Ensure ffprobe (bundled with ffmpeg) is in PATH');

// 4. Python 3
check('Python 3', () => {
  const r = spawnSync('python', ['--version'], { encoding: 'utf8' });
  return r.status === 0;
}, 'Install Python 3 from https://python.org/');

// 5. Pillow (PIL)
check('Python Pillow (PIL)', () => {
  const r = spawnSync('python', ['-c', 'from PIL import Image'], { encoding: 'utf8' });
  return r.status === 0;
}, 'Run: pip install pillow');

// 6. Playwright Chromium
await (async () => {
  process.stdout.write(`Checking ${'Playwright Chromium'.padEnd(25)} ... `);
  try {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({ headless: true });
    await browser.close();
    console.log('OK');
    pass++;
  } catch (e) {
    console.log('MISSING');
    console.log('  -> Fix: npx playwright install chromium');
    fail++;
  }
})();

console.log('----------------------------------------');
if (fail === 0) {
  console.log(`All prerequisites satisfied! (${pass}/${pass} passed)`);
  process.exit(0);
} else {
  console.error(`Preflight failed: ${fail} issue(s) detected (${pass} passed).`);
  process.exit(1);
}
