#!/usr/bin/env node
/**
 * validate_story.mjs — validate story.json against structure, position contracts,
 * and continuity rules from references/07 and references/11.
 *
 * Usage:
 *   node scripts/validate_story.mjs [path/to/story.json]
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';

const file = process.argv[2] || 'story.json';
const fullPath = resolve(process.cwd(), file);

if (!existsSync(fullPath)) {
  console.error(`Error: story file not found at ${fullPath}`);
  process.exit(2);
}

let story;
try {
  story = JSON.parse(readFileSync(fullPath, 'utf8'));
} catch (e) {
  console.error(`Error: invalid JSON in ${file}:`, e.message);
  process.exit(1);
}

const errors = [];
const warnings = [];

// 1. Project level
if (!story.project) {
  errors.push('Missing top-level "project" object');
} else {
  const p = story.project;
  if (!p.title) errors.push('project.title is required');
  if (typeof p.fps !== 'number' || p.fps <= 0) errors.push('project.fps must be a positive number');
  if (typeof p.duration_s !== 'number' || p.duration_s <= 0) errors.push('project.duration_s must be a positive number');
  if (typeof p.width !== 'number' || p.width <= 0) errors.push('project.width must be a positive number');
  if (typeof p.height !== 'number' || p.height <= 0) errors.push('project.height must be a positive number');
}

// 2. Assets
const characterIds = new Set();
if (!story.assets || !Array.isArray(story.assets.characters) || story.assets.characters.length === 0) {
  errors.push('assets.characters must be a non-empty array');
} else {
  for (const c of story.assets.characters) {
    if (!c.id) errors.push('Every asset character must have an "id"');
    else characterIds.add(c.id);
    if (!c.color) warnings.push(`Character "${c.id || 'unknown'}" missing explicit color`);
    if (!c.height) warnings.push(`Character "${c.id || 'unknown'}" missing explicit height`);
  }
}

// 3. Scenes & Position Contracts
if (!Array.isArray(story.scenes) || story.scenes.length === 0) {
  errors.push('scenes must be a non-empty array');
} else {
  let totalDuration = 0;
  for (let sIdx = 0; sIdx < story.scenes.length; sIdx++) {
    const sc = story.scenes[sIdx];
    const sName = sc.id || `scene[${sIdx}]`;

    if (typeof sc.duration_s !== 'number' || sc.duration_s <= 0) {
      errors.push(`${sName}: duration_s must be a positive number`);
    } else {
      totalDuration += sc.duration_s;
    }

    if (!Array.isArray(sc.characters) || sc.characters.length === 0) {
      errors.push(`${sName}: must contain at least one character position contract`);
    } else {
      for (const charContract of sc.characters) {
        const cId = charContract.id;
        if (!cId) {
          errors.push(`${sName}: character contract missing "id"`);
          continue;
        }
        if (!characterIds.has(cId)) {
          errors.push(`${sName}: character "${cId}" is not declared in assets.characters`);
        }
        if (!Array.isArray(charContract.start) || charContract.start.length !== 2) {
          errors.push(`${sName}: character "${cId}" must have start: [x, y] coordinates`);
        }
        if (!Array.isArray(charContract.end) || charContract.end.length !== 2) {
          errors.push(`${sName}: character "${cId}" must have end: [x, y] coordinates`);
        }
        if (charContract.face !== 1 && charContract.face !== -1) {
          errors.push(`${sName}: character "${cId}" must have face: 1 or -1`);
        }
        if (!charContract.start_pose) {
          warnings.push(`${sName}: character "${cId}" missing start_pose`);
        }
        if (!charContract.end_pose) {
          warnings.push(`${sName}: character "${cId}" missing end_pose`);
        }
      }
    }
  }

  // Duration match check
  if (story.project && typeof story.project.duration_s === 'number') {
    if (Math.abs(totalDuration - story.project.duration_s) > 0.05) {
      warnings.push(`Sum of scene durations (${totalDuration.toFixed(2)}s) does not match project.duration_s (${story.project.duration_s}s)`);
    }
  }

  // Continuity across adjacent scenes
  for (let i = 0; i < story.scenes.length - 1; i++) {
    const sA = story.scenes[i];
    const sB = story.scenes[i + 1];
    for (const cA of (sA.characters || [])) {
      const cB = (sB.characters || []).find(c => c.id === cA.id);
      if (cB) {
        if (cA.face !== cB.face && !sB.turn) {
          warnings.push(`Facing change for "${cA.id}" between ${sA.id} and ${sB.id} without explicit turn flag`);
        }
      }
    }
  }
}

// 4. Report
console.log(`Validating ${file}...`);
if (warnings.length > 0) {
  console.log(`\nWarnings (${warnings.length}):`);
  for (const w of warnings) console.log(`  - ${w}`);
}

if (errors.length > 0) {
  console.error(`\nValidation FAILED with ${errors.length} error(s):`);
  for (const err of errors) console.error(`  [ERROR] ${err}`);
  process.exit(1);
}

console.log('✓ story.json is valid (passed all position contract and structure checks).');
process.exit(0);
