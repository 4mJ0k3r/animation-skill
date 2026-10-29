import { POSES, solve, blendPose, walkPose, ik2, DEFAULTS } from './rig.js';

let pass = 0, fail = 0;
const ok = (name, cond) => {
  if (cond) {
    pass++;
  } else {
    fail++;
    console.error('FAIL:', name);
  }
};

// 1. All POSES solve NaN-free
for (const [name, p] of Object.entries(POSES)) {
  const s = solve(p);
  let hasNaN = false;
  for (const [k, v] of Object.entries(s)) {
    if (Array.isArray(v)) {
      if (Number.isNaN(v[0]) || Number.isNaN(v[1])) hasNaN = true;
    } else if (typeof v === 'number' && Number.isNaN(v)) {
      hasNaN = true;
    }
  }
  ok(`pose ${name} solves NaN-free`, !hasNaN);
}

// 2. Facing mirrors x coordinates
const sRight = solve(POSES.wave, { facing: 1 });
const sLeft = solve(POSES.wave, { facing: -1 });
ok('facing mirrors handL.x', Math.abs(sRight.handL[0] + sLeft.handL[0]) < 1e-4);
ok('facing keeps handL.y same', Math.abs(sRight.handL[1] - sLeft.handL[1]) < 1e-4);

// 3. ik2 returns joint at distance L1 from root
const root = { x: 10, y: 20 };
const target = { x: 50, y: 60 };
const L1 = 30, L2 = 35;
const joint = ik2(root, target, L1, L2, 1);
const d1 = Math.hypot(joint.x - root.x, joint.y - root.y);
ok('ik2 joint distance equals L1', Math.abs(d1 - L1) < 1e-3);

// 4. walkPose produces alternating leg angles across phase
const w0 = walkPose(0, 0);
const wHalf = walkPose(0.5, 0);
ok('walkPose legL at phase 0 matches legR at phase 0.5',
  Math.abs(w0.legL[0] - wHalf.legR[0]) < 1e-4 && Math.abs(w0.legL[1] - wHalf.legR[1]) < 1e-4);

// 5. blendPose at t=0.5 interpolates linearly
const bl = blendPose({ torso: 0, bob: 0, armL: [0, 0], armR: [0, 0], legL: [0, 0], legR: [0, 0] },
                     { torso: 20, bob: 10, armL: [10, 20], armR: [30, 40], legL: [50, 60], legR: [70, 80] }, 0.5);
ok('blendPose torso', bl.torso === 10);
ok('blendPose bob', bl.bob === 5);
ok('blendPose armL', bl.armL[0] === 5 && bl.armL[1] === 10);

// 6. Bent limb (lower angle as absolute, not relative): hand must sit BEHIND
// the straight-down fall line, not collapse onto it. This is the regression
// guard for the old `B = a + b` bug that drew every bent limb as one line.
{
  const s = solve({ armL: [0, 30] });
  const dx = Math.abs(s.handL[0] - s.shoulder[0]);
  ok('bent limb (lower as absolute angle) reaches off-axis', dx > 5);
}

console.log(`rig: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
