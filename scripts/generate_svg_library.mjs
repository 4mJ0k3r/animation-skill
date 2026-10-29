#!/usr/bin/env node
/**
 * generate_svg_library.mjs — exports SVG assets derived strictly from rig.js
 * ensuring the rig is the single source of truth (as decided in CONTINUATION.md).
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { POSES, solve, DEFAULTS } from '../library/js/rig.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', 'library', 'svg');

function ensureDir(p) {
  mkdirSync(p, { recursive: true });
}

function poseToSVG(pose, opts = {}) {
  const h = opts.height || 320;
  const strokeW = opts.strokeWidth || 7;
  const color = opts.color || '#1c1c1c';
  const s = solve(pose, { height: h, facing: opts.facing || 1 });

  // ViewBox: 400x400, hip at (200, 260) with y-down coordinate flip
  const cx = 200, cy = 260;
  const pt = (p) => `${(cx + p[0]).toFixed(1)},${(cy - p[1]).toFixed(1)}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <g fill="none" stroke="${color}" stroke-width="${strokeW}" stroke-linecap="round" stroke-linejoin="round">
    <!-- Spine -->
    <line x1="${pt(s.hip).split(',')[0]}" y1="${pt(s.hip).split(',')[1]}" x2="${pt(s.neckTop).split(',')[0]}" y2="${pt(s.neckTop).split(',')[1]}" />
    <!-- Left Arm -->
    <polyline points="${pt(s.shoulder)} ${pt(s.elbowL)} ${pt(s.handL)}" />
    <!-- Right Arm -->
    <polyline points="${pt(s.shoulder)} ${pt(s.elbowR)} ${pt(s.handR)}" />
    <!-- Left Leg -->
    <polyline points="${pt(s.hip)} ${pt(s.kneeL)} ${pt(s.footL)}" />
    <!-- Right Leg -->
    <polyline points="${pt(s.hip)} ${pt(s.kneeR)} ${pt(s.footR)}" />
    <!-- Head -->
    <circle cx="${pt(s.headCenter).split(',')[0]}" cy="${pt(s.headCenter).split(',')[1]}" r="${s.headR.toFixed(1)}" fill="${opts.headFill || '#ffffff'}" />
  </g>
</svg>`;
}

function faceToSVG(name) {
  const R = 60;
  let inner = '';
  if (name === 'happy') {
    inner = `
    <circle cx="45" cy="55" r="7" fill="#1c1c1c" />
    <circle cx="75" cy="55" r="7" fill="#1c1c1c" />
    <path d="M 45 80 Q 60 95 75 80" fill="none" stroke="#1c1c1c" stroke-width="4" stroke-linecap="round" />`;
  } else if (name === 'surprised') {
    inner = `
    <circle cx="45" cy="52" r="9" fill="none" stroke="#1c1c1c" stroke-width="4" />
    <circle cx="75" cy="52" r="9" fill="none" stroke="#1c1c1c" stroke-width="4" />
    <circle cx="60" cy="80" r="12" fill="none" stroke="#1c1c1c" stroke-width="4" />`;
  } else if (name === 'sad') {
    inner = `
    <circle cx="45" cy="58" r="7" fill="#1c1c1c" />
    <circle cx="75" cy="58" r="7" fill="#1c1c1c" />
    <path d="M 45 85 Q 60 72 75 85" fill="none" stroke="#1c1c1c" stroke-width="4" stroke-linecap="round" />`;
  } else if (name === 'angry') {
    inner = `
    <circle cx="45" cy="55" r="7" fill="#1c1c1c" />
    <circle cx="75" cy="55" r="7" fill="#1c1c1c" />
    <line x1="38" y1="42" x2="52" y2="48" stroke="#1c1c1c" stroke-width="4" stroke-linecap="round" />
    <line x1="82" y1="42" x2="68" y2="48" stroke="#1c1c1c" stroke-width="4" stroke-linecap="round" />
    <line x1="48" y1="80" x2="72" y2="80" stroke="#1c1c1c" stroke-width="4" stroke-linecap="round" />`;
  } else if (name === 'oops') {
    inner = `
    <circle cx="45" cy="52" r="8" fill="none" stroke="#1c1c1c" stroke-width="4" />
    <circle cx="75" cy="52" r="8" fill="none" stroke="#1c1c1c" stroke-width="4" />
    <ellipse cx="60" cy="82" rx="10" ry="14" fill="none" stroke="#1c1c1c" stroke-width="4" />`;
  } else {
    // neutral
    inner = `
    <circle cx="45" cy="55" r="7" fill="#1c1c1c" />
    <circle cx="75" cy="55" r="7" fill="#1c1c1c" />
    <line x1="48" y1="80" x2="72" y2="80" stroke="#1c1c1c" stroke-width="4" stroke-linecap="round" />`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120">
  <circle cx="60" cy="60" r="${R - 4}" fill="#ffffff" stroke="#1c1c1c" stroke-width="6" />
  ${inner}
</svg>`;
}

// 1. Characters
ensureDir(join(root, 'characters'));
writeFileSync(join(root, 'characters', 'hero-default.svg'), poseToSVG(POSES.neutral, { color: '#1c1c1c' }));
writeFileSync(join(root, 'characters', 'secondary-mascot.svg'), poseToSVG(POSES.neutral, { color: '#0984e3', height: 224, strokeWidth: 5 }));

// 2. Poses
ensureDir(join(root, 'poses'));
for (const [name, p] of Object.entries(POSES)) {
  writeFileSync(join(root, 'poses', `${name}.svg`), poseToSVG(p));
}

// 3. Faces
ensureDir(join(root, 'faces'));
['neutral', 'happy', 'sad', 'surprised', 'angry', 'oops'].forEach(f => {
  writeFileSync(join(root, 'faces', `${f}.svg`), faceToSVG(f));
});

// 4. Props
ensureDir(join(root, 'props'));
writeFileSync(join(root, 'props', 'rock.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 50" width="80" height="50">
  <path d="M 10 40 Q 20 10 45 12 Q 70 15 72 38 Q 72 45 10 40 Z" fill="#8c8275" stroke="#5a5247" stroke-width="3" />
</svg>`);

writeFileSync(join(root, 'props', 'box.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="80" height="80">
  <rect x="10" y="10" width="60" height="60" rx="4" fill="#d2a679" stroke="#8a5a2a" stroke-width="4" />
  <line x1="10" y1="40" x2="70" y2="40" stroke="#8a5a2a" stroke-width="2" />
</svg>`);

// 5. Backgrounds
ensureDir(join(root, 'backgrounds'));
writeFileSync(join(root, 'backgrounds', 'ground-line.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 100" width="960" height="100">
  <line x1="0" y1="50" x2="960" y2="50" stroke="#d8d0c2" stroke-width="3" stroke-linecap="round" />
</svg>`);

console.log('✓ Generated SVG asset library mirroring rig.js.');
