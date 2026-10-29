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
writeFileSync(join(root, 'characters', 'stickman.svg'), poseToSVG(POSES.neutral, { color: '#1c1c1c' }));
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

writeFileSync(join(root, 'props', 'bench.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 70" width="120" height="70">
  <rect x="10" y="25" width="100" height="12" rx="2" fill="#8c5836" stroke="#5a3418" stroke-width="2" />
  <line x1="25" y1="37" x2="25" y2="65" stroke="#333" stroke-width="5" stroke-linecap="round" />
  <line x1="95" y1="37" x2="95" y2="65" stroke="#333" stroke-width="5" stroke-linecap="round" />
</svg>`);

writeFileSync(join(root, 'props', 'table.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 140 90" width="140" height="90">
  <rect x="10" y="20" width="120" height="14" rx="2" fill="#c49a6c" stroke="#7a5530" stroke-width="3" />
  <line x1="25" y1="34" x2="25" y2="85" stroke="#7a5530" stroke-width="6" stroke-linecap="round" />
  <line x1="115" y1="34" x2="115" y2="85" stroke="#7a5530" stroke-width="6" stroke-linecap="round" />
</svg>`);

writeFileSync(join(root, 'props', 'door.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 180" width="100" height="180">
  <rect x="10" y="10" width="80" height="165" fill="#e5d5be" stroke="#8b7355" stroke-width="4" />
  <circle cx="25" cy="95" r="5" fill="#d4af37" stroke="#8b7355" stroke-width="2" />
</svg>`);

writeFileSync(join(root, 'props', 'ball.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" width="60" height="60">
  <circle cx="30" cy="30" r="24" fill="#e74c3c" stroke="#c0392b" stroke-width="3" />
  <circle cx="22" cy="22" r="5" fill="#ffffff88" />
</svg>`);

writeFileSync(join(root, 'props', 'laptop.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 60" width="80" height="60">
  <polygon points="10,50 70,50 65,42 15,42" fill="#bdc3c7" stroke="#7f8c8d" stroke-width="2" />
  <polygon points="18,42 62,42 58,15 22,15" fill="#2c3e50" stroke="#7f8c8d" stroke-width="2" />
  <rect x="25" y="18" width="30" height="20" fill="#3498db" />
</svg>`);

writeFileSync(join(root, 'props', 'heart.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 60 60" width="60" height="60">
  <path d="M 30 50 Q 10 32 10 20 A 10 10 0 0 1 30 16 A 10 10 0 0 1 50 20 Q 50 32 30 50 Z" fill="#e74c3c" stroke="#c0392b" stroke-width="2" />
</svg>`);

writeFileSync(join(root, 'props', 'sun.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80" width="80" height="80">
  <circle cx="40" cy="40" r="18" fill="#f1c40f" stroke="#f39c12" stroke-width="3" />
  <g stroke="#f39c12" stroke-width="3" stroke-linecap="round">
    <line x1="40" y1="8" x2="40" y2="16" />
    <line x1="40" y1="64" x2="40" y2="72" />
    <line x1="8" y1="40" x2="16" y2="40" />
    <line x1="64" y1="40" x2="72" y2="40" />
    <line x1="17" y1="17" x2="23" y2="23" />
    <line x1="57" y1="57" x2="63" y2="63" />
    <line x1="17" y1="63" x2="23" y2="57" />
    <line x1="57" y1="23" x2="63" y2="17" />
  </g>
</svg>`);

writeFileSync(join(root, 'props', 'cloud.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 70" width="120" height="70">
  <path d="M 25 50 Q 10 50 15 35 Q 20 20 40 22 Q 55 10 75 20 Q 95 12 100 32 Q 115 38 105 50 Z" fill="#ecf0f1" stroke="#bdc3c7" stroke-width="3" />
</svg>`);

writeFileSync(join(root, 'props', 'tree.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 160" width="120" height="160">
  <rect x="52" y="90" width="16" height="65" rx="2" fill="#795548" stroke="#4e342e" stroke-width="3" />
  <circle cx="60" cy="65" r="45" fill="#2ecc71" stroke="#27ae60" stroke-width="4" />
</svg>`);

// 5. Backgrounds
ensureDir(join(root, 'backgrounds'));
writeFileSync(join(root, 'backgrounds', 'ground-line.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 100" width="960" height="100">
  <line x1="0" y1="50" x2="960" y2="50" stroke="#d8d0c2" stroke-width="3" stroke-linecap="round" />
</svg>`);

writeFileSync(join(root, 'backgrounds', 'room.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 540" width="960" height="540">
  <rect width="960" height="400" fill="#fdfbf7" />
  <rect y="400" width="960" height="140" fill="#e8dec8" />
  <line x1="0" y1="400" x2="960" y2="400" stroke="#8b7355" stroke-width="4" />
  <!-- Window -->
  <rect x="650" y="80" width="180" height="180" fill="#dff9fb" stroke="#778ca3" stroke-width="5" />
  <line x1="740" y1="80" x2="740" y2="260" stroke="#778ca3" stroke-width="4" />
  <line x1="650" y1="170" x2="830" y2="170" stroke="#778ca3" stroke-width="4" />
</svg>`);

writeFileSync(join(root, 'backgrounds', 'street.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 540" width="960" height="540">
  <rect width="960" height="380" fill="#c7ecee" />
  <rect y="380" width="960" height="70" fill="#dcdde1" />
  <rect y="450" width="960" height="90" fill="#718093" />
  <line x1="0" y1="380" x2="960" y2="380" stroke="#7f8fa6" stroke-width="2" />
  <line x1="0" y1="450" x2="960" y2="450" stroke="#2f3640" stroke-width="3" />
</svg>`);

writeFileSync(join(root, 'backgrounds', 'park.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 540" width="960" height="540">
  <rect width="960" height="340" fill="#dff9fb" />
  <path d="M 0 380 Q 240 320 480 360 Q 720 400 960 340 L 960 540 L 0 540 Z" fill="#badc58" stroke="#6ab04c" stroke-width="4" />
</svg>`);

writeFileSync(join(root, 'backgrounds', 'void-gradient.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 540" width="960" height="540">
  <defs>
    <radialGradient id="voidGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#ffffff" />
      <stop offset="100%" stop-color="#e2d9cc" />
    </radialGradient>
  </defs>
  <rect width="960" height="540" fill="url(#voidGrad)" />
</svg>`);

writeFileSync(join(root, 'backgrounds', 'night.svg'), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 540" width="960" height="540">
  <rect width="960" height="420" fill="#130f40" />
  <rect y="420" width="960" height="120" fill="#0c2461" />
  <!-- Moon -->
  <circle cx="800" cy="100" r="35" fill="#f6e58d" />
</svg>`);

console.log('✓ Generated SVG asset library mirroring rig.js.');
