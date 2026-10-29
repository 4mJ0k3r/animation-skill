#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const argv = process.argv.slice(2);
const framesDir = argv[0] || 'out/frames';
const outDir = argv[1] || 'out';
const fps = argv[2] || '30';
const format = (argv[3] || 'both').toLowerCase();

mkdirSync(outDir, { recursive: true });

const f0 = join(framesDir, 'frame-0000.png');
if (!existsSync(f0)) {
  console.error(`Error: no frames found in ${framesDir} (expected frame-0000.png)`);
  process.exit(1);
}

// Probe dimensions
let scaleVf = 'scale=1920:1080:flags=lanczos';
const probe = spawnSync('ffprobe', [
  '-v', 'error',
  '-select_streams', 'v:0',
  '-show_entries', 'stream=width,height',
  '-of', 'csv=s=x:p=0',
  f0
], { encoding: 'utf8' });

if (probe.status === 0 && probe.stdout.trim()) {
  const [w, h] = probe.stdout.trim().split('x').map(Number);
  if (w && h) {
    if (w === h) scaleVf = 'scale=1080:1080:flags=lanczos';
    else if (w < h) scaleVf = 'scale=1080:1920:flags=lanczos';
    else scaleVf = 'scale=1920:1080:flags=lanczos';
  }
}

if (format === 'mp4' || format === 'both') {
  console.log(`Stitching MP4 @ ${fps}fps (${scaleVf})...`);
  const mp4Path = join(outDir, 'animation.mp4');
  const res = spawnSync('ffmpeg', [
    '-y', '-framerate', String(fps),
    '-i', join(framesDir, 'frame-%04d.png'),
    '-vf', scaleVf,
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-pix_fmt', 'yuv420p',
    '-movflags', '+faststart',
    mp4Path
  ], { stdio: 'inherit' });
  if (res.status !== 0) process.exit(res.status || 1);
  console.log(`Wrote ${mp4Path}`);
}

if (format === 'gif' || format === 'both') {
  console.log('Stitching GIF (two-pass palette)...');
  const gifPath = join(outDir, 'animation.gif');
  const res = spawnSync('ffmpeg', [
    '-y', '-framerate', String(fps),
    '-i', join(framesDir, 'frame-%04d.png'),
    '-vf', 'fps=12,scale=720:-1:flags=lanczos,split[s0][s1];[s0]palettegen=max_colors=196:stats_mode=diff[p];[s1][p]paletteuse=dither=floyd_steinberg',
    '-loop', '0',
    gifPath
  ], { stdio: 'inherit' });
  if (res.status !== 0) process.exit(res.status || 1);
  console.log(`Wrote ${gifPath}`);
}
