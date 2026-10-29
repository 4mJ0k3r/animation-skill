import https from 'node:https';
import http from 'node:http';

const urls = [
  'https://github.com/kelano86/what-if-animation',
  'https://github.com/bassimeledath/stix',
  'https://github.com/LottieFiles/motion-design-skill',
  'https://github.com/iart-ai/kinetic-typography-skills',
  'https://github.com/iart-ai/manim-skills',
  'https://github.com/iart-ai/webgl-animation-skills',
  'https://github.com/haidrrrry/claude-remotion-skill',
  'https://github.com/charlie947/motion-graphics-skills',
  'https://github.com/bestagentkits/motion-video-skill',
  'https://github.com/frankxai/awesome-motion-design-agent-skills',
  'https://github.com/zhuyansen/awesome-claude-video-skills',
  'https://github.com/Yusuke710/manim-skill',
  'https://github.com/filippocalippo/StykAnimate-App',
  'https://github.com/mans-andersson/animated-svg-stickman',
  'https://github.com/madeindjs/stickman',
  'https://github.com/twinji/walking-stick-figure',
  'https://github.com/levnik-b/stickyman',
  'https://github.com/wazabaki/isometric-spider',
  'https://github.com/RGBboy/fabrik-2d',
  'https://github.com/tmf-code/inverse-kinematics',
  'https://github.com/ArcademMan/PyLuxel',
  'https://shengyugames.com/devlog/two-bone-ik-stick-figure-animation',
  'https://github.com/motion-canvas/motion-canvas',
  'https://github.com/motion-canvas/examples',
  'https://github.com/motion-canvas/exporters',
  'https://github.com/remotion-dev/remotion',
  'https://github.com/GreenSock/GSAP',
  'https://github.com/mrdoob/three.js',
  'https://github.com/FFmpeg/FFmpeg',
  'https://github.com/puppeteer/puppeteer',
  'https://github.com/microsoft/playwright',
  'https://github.com/bencevans/screenshot-desktop',
  'https://github.com/airbnb/lottie-web',
  'https://github.com/rive-app/rive-wasm',
  'https://github.com/iart-ai/motion-design-skills'
];

async function checkUrl(url) {
  return new Promise((resolve) => {
    try {
      const u = new URL(url);
      const req = (u.protocol === 'https:' ? https : http).request(u, {
        method: 'HEAD',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AnimationSkillLinkChecker/1.0'
        },
        timeout: 8000
      }, (res) => {
        resolve({ url, status: res.statusCode, ok: res.statusCode >= 200 && res.statusCode < 400 });
      });
      req.on('error', (e) => resolve({ url, status: 'ERROR: ' + e.message, ok: false }));
      req.on('timeout', () => { req.destroy(); resolve({ url, status: 'TIMEOUT', ok: false }); });
      req.end();
    } catch (e) {
      resolve({ url, status: 'ERR: ' + e.message, ok: false });
    }
  });
}

console.log(`Checking ${urls.length} URLs from references/00-source-index.md...\n`);
const results = await Promise.all(urls.map(checkUrl));
for (const r of results) {
  const symbol = r.ok ? '✓' : '✗';
  console.log(`${symbol} [${r.status}] ${r.url}`);
}
