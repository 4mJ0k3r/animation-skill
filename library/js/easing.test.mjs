// Minimal self-test for the library. Run: node library/js/easing.test.mjs
import { Easing, cubicBezier, spring } from './easing.js';

let pass = 0, fail = 0;
const ok = (name, cond) => { if (cond) { pass++; } else { fail++; console.error('FAIL', name); } };

// Endpoints
ok('linear endpoints', Easing.linear(0) === 0 && Easing.linear(1) === 1);
ok('power2Out ends', Easing.power2Out(0) === 0 && Easing.power2Out(1) === 1);
ok('backOut overshoots', Easing.backOut(0.8) > 1);
ok('bounceOut settles', Easing.bounceOut(1) === 1);
ok('elasticOut settles', Easing.elasticOut(1) === 1);
ok('sineInOut symmetric', Math.abs(Easing.sineInOut(0.5) - 0.5) < 1e-6);

// cubicBezier matches identity at t=0/1 and monotone for power2-like curves
const md3 = cubicBezier(0.2, 0, 0, 1);
ok('bezier endpoints', md3(0) === 0 && md3(1) === 1);
ok('bezier monotone', md3(0.25) < md3(0.5) && md3(0.5) < md3(0.75));

// spring: standard params settle at 1. Under-damped springs are NOT
// monotone (they overshoot then wobble back) — so only check endpoints and
// that the value actually reaches 1 at u=1.
const sp = spring(170, 26);
ok('spring endpoints', Math.abs(sp(0)) < 0.01 && sp(1) === 1);
// A heavily damped spring (no wobble) SHOULD be monotone rising.
const sd = spring(100, 40); // zeta = 40/(2*10) = 2.0 > 1 -> power2Out
ok('overdamped spring monotone', sd(0.3) < sd(0.6) && sd(0.6) < sd(0.9) && sd(1) === 1);

console.log(`easing: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
