import { Timeline } from './timeline.js';
import { Easing } from './easing.js';

let pass = 0, fail = 0;
const ok = (name, cond) => {
  if (cond) {
    pass++;
  } else {
    fail++;
    console.error('FAIL:', name);
  }
};

const tl = new Timeline({ fps: 30, duration: 60 });
tl.add('x', 0, 100, Easing.linear);
tl.add('x', 20, 200, Easing.linear);
tl.add('pos', 0, [0, 10]);
tl.add('pos', 10, [100, 50]);

// 1. Interpolation at midpoint
const s10 = tl.seek(10);
ok('lerp number at midpoint', Math.abs(s10.x - 150) < 1e-4);
ok('lerp array at midpoint', Math.abs(s10.pos[0] - 100) < 1e-4 && Math.abs(s10.pos[1] - 50) < 1e-4);

// 2. Determinism: same frame twice returns identical values
const a = tl.seek(7);
const b = tl.seek(7);
ok('determinism on seek', a.x === b.x && a.pos[0] === b.pos[0] && a.pos[1] === b.pos[1]);

console.log(`timeline: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
