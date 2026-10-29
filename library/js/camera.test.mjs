import { Camera } from './camera.js';
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

const cam = new Camera();
cam.add(0, { x: 100, y: 100, zoom: 1.0, shake: 0 });
cam.add(20, { x: 200, y: 300, zoom: 2.0, shake: 10 }, Easing.linear);

// 1. Initial keyframe
const c0 = cam.seek(0);
ok('camera initial state', c0.x === 100 && c0.y === 100 && c0.zoom === 1.0);

// 2. Midpoint interpolation
const c10 = cam.seek(10);
ok('camera midpoint x', Math.abs(c10.x - 150) < 1e-4);
ok('camera midpoint y', Math.abs(c10.y - 200) < 1e-4);
ok('camera midpoint zoom', Math.abs(c10.zoom - 1.5) < 1e-4);
ok('camera midpoint shake', Math.abs(c10.shake - 5) < 1e-4);

// 3. Deterministic shake
const sA = cam.shakeAt(15, c10);
const sB = cam.shakeAt(15, c10);
ok('camera deterministic shake', sA[0] === sB[0] && sA[1] === sB[1]);
const sZero = cam.shakeAt(15, { shake: 0 });
ok('camera zero shake gives [0, 0]', sZero[0] === 0 && sZero[1] === 0);

// 4. toScreen conversion
const screen = cam.toScreen(150, 200, c10, { w: 960, h: 960 });
// cam center is at (150, 200), so world (150, 200) should be exactly screen center (480, 480)
ok('toScreen centers target', Math.abs(screen[0] - 480) < 1e-4 && Math.abs(screen[1] - 480) < 1e-4);

const screenOffset = cam.toScreen(250, 200, c10, { w: 960, h: 960 });
// wx - cx = 100, zoom = 1.5 -> sx = 480 + 150 = 630
ok('toScreen scales offset by zoom', Math.abs(screenOffset[0] - 630) < 1e-4);

console.log(`camera: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
