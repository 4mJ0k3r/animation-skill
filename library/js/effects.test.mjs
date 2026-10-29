import { hash, speedLines, dust, impact, textPop, flash, motionGrid } from './effects.js';

let pass = 0, fail = 0;
const ok = (name, cond) => {
  if (cond) {
    pass++;
  } else {
    fail++;
    console.error('FAIL:', name);
  }
};

// 1. hash determinism and range
const h1 = hash(42, 3);
const h2 = hash(42, 3);
ok('hash deterministic', h1 === h2);
ok('hash range in [0, 1)', h1 >= 0 && h1 < 1);
const h3 = hash(42, 4);
ok('hash varies with index', h1 !== h3);

// Mock canvas 2D context
function createMockCtx() {
  const calls = [];
  return {
    calls,
    save() { calls.push('save'); },
    restore() { calls.push('restore'); },
    beginPath() { calls.push('beginPath'); },
    moveTo(x, y) { calls.push(['moveTo', x, y]); },
    lineTo(x, y) { calls.push(['lineTo', x, y]); },
    stroke() { calls.push('stroke'); },
    fill() { calls.push('fill'); },
    arc(x, y, r, a0, a1) { calls.push(['arc', x, y, r, a0, a1]); },
    fillRect(x, y, w, h) { calls.push(['fillRect', x, y, w, h]); },
    fillText(text, x, y) { calls.push(['fillText', text, x, y]); },
    measureText(text) { return { width: text.length * 10 }; },
    translate(x, y) { calls.push(['translate', x, y]); },
    scale(x, y) { calls.push(['scale', x, y]); },
    set globalAlpha(v) { calls.push(['alpha', v]); },
    set strokeStyle(v) { calls.push(['strokeStyle', v]); },
    set fillStyle(v) { calls.push(['fillStyle', v]); },
    set lineWidth(v) { calls.push(['lineWidth', v]); },
    set lineCap(v) { calls.push(['lineCap', v]); },
    set font(v) { calls.push(['font', v]); },
    set textAlign(v) { calls.push(['textAlign', v]); },
    set textBaseline(v) { calls.push(['textBaseline', v]); },
  };
}

// 2. speedLines
const ctx1 = createMockCtx();
speedLines(ctx1, [100, 200], { lines: 4 });
ok('speedLines runs and balances save/restore',
  ctx1.calls.filter(c => c === 'save').length === 1 &&
  ctx1.calls.filter(c => c === 'restore').length === 1);

// 3. dust
const ctx2 = createMockCtx();
dust(ctx2, [100, 200], 0.3);
ok('dust draws arcs', ctx2.calls.some(c => Array.isArray(c) && c[0] === 'arc'));

// 4. impact
const ctx3 = createMockCtx();
impact(ctx3, [100, 200], 0.5);
ok('impact draws strokes', ctx3.calls.some(c => c === 'stroke'));

// 5. textPop
const ctx4 = createMockCtx();
textPop(ctx4, 'BAM!', [100, 200], 0.5);
ok('textPop calls fillText', ctx4.calls.some(c => Array.isArray(c) && c[0] === 'fillText' && c[1] === 'BAM!'));

// 6. flash
const ctx5 = createMockCtx();
flash(ctx5, 960, 960, 0.5);
ok('flash fills rect at t=0.5', ctx5.calls.some(c => Array.isArray(c) && c[0] === 'fillRect'));
const ctx6 = createMockCtx();
flash(ctx6, 960, 960, 0);
ok('flash is no-op at t=0', ctx6.calls.length === 0);

// 7. motionGrid
const ctx7 = createMockCtx();
motionGrid(ctx7, 960, 960, 0.2);
ok('motionGrid draws lines', ctx7.calls.some(c => Array.isArray(c) && c[0] === 'lineTo'));

console.log(`effects: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
