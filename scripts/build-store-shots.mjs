// Frames the raw app captures in .shots/ into store screenshots with a caption, using headless Chrome.
// Raw captures: phone-N-name.png (393×852 @3x) and ipad-N-name.png (1024×1366 @2x), taken from the running app
// (see PUBLISHING.md, "Store screenshots"). Usage: node scripts/build-store-shots.mjs
import { execFileSync } from 'node:child_process';
import { readdirSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;
const shots = join(root, '.shots');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const tmp = mkdtempSync(join(tmpdir(), 'stg-shots-'));
const font = (f) => `file://${join(root, 'fonts', f)}`;

const CAPTIONS = {
  finder: ['Point your phone. Find anything.', 'Arrows lead you to planets, stars and galaxies – even through the Earth.'],
  pictures: ['See the pictures in the stars', 'The Hunter, the Bull, the Great Dog… drawn over the real sky.'],
  weather: ['Will it be clear tonight?', 'Clouds, wind and rain, hour by hour, right over your sky.'],
  places: ['Point at the Taj Mahal', 'Find any place on Earth: how far away, and which way.'],
  storm: ['Follow cyclones from home', 'Tropical storms: how far, which way, and where they’re heading.'],
  journey: ['A journey through the universe', '61 wonders in 12 chapters, one step at a time.'],
  saturn: ['Real science, kid-sized', 'Photos, live distances and mind-blowing facts for every object.'],
  tonight: ['What can I see tonight?', 'The best sights from exactly where you are.'],
};

// [output prefix, raw prefix, width, height, caption block height, screenshot width, corner radius, title px, subtitle px]
const FORMATS = [
  ['store/ios-6.9', 'phone', 1320, 2868, 600, 1100, 90, 92, 46],
  ['store/android', 'phone', 1080, 1920, 400, 820, 64, 64, 32],
  ['store/ipad-13', 'ipad', 2064, 2752, 470, 1640, 56, 100, 48],
];

function frame(raw, [title, sub], [, , w, h, capH, shotW, radius, tPx, sPx]) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @font-face { font-family: 'Space Grotesk'; src: url('${font('SpaceGrotesk-latin-V8mDoQDjQS.woff2')}') format('woff2'); font-weight: 300 700; }
    html, body { margin: 0; width: ${w}px; height: ${h}px; overflow: hidden; }
    body { background: radial-gradient(120% 70% at 50% 0%, #2a2a86 0%, #14134a 45%, #05060f 100%); font-family: 'Space Grotesk'; color: #fff; position: relative; }
    .cap { position: absolute; top: 0; left: 0; right: 0; height: ${capH}px; display: grid; place-content: center; text-align: center; padding: 0 ${w * 0.08}px; }
    h1 { margin: 0; font-size: ${tPx}px; line-height: 1.08; font-weight: 700; letter-spacing: -0.015em; }
    p { margin: ${sPx * 0.6}px 0 0; font-size: ${sPx}px; line-height: 1.3; color: #cfd6ff; font-weight: 500; }
    .glow { position: absolute; left: 50%; top: ${capH + 40}px; width: ${shotW * 1.1}px; height: ${shotW}px; transform: translateX(-50%); background: radial-gradient(closest-side, rgba(127,227,255,.22), transparent); }
    .shot { position: absolute; left: 50%; top: ${capH}px; width: ${shotW}px; transform: translateX(-50%); border-radius: ${radius}px; border: ${Math.round(w / 220)}px solid rgba(255,255,255,.14); box-shadow: 0 30px 80px rgba(0,0,0,.55); overflow: hidden; }
    .shot img { display: block; width: 100%; }
  </style></head><body>
    <div class="cap"><h1>${title}</h1><p>${sub}</p></div>
    <div class="glow"></div>
    <div class="shot"><img src="file://${join(shots, raw)}"></div>
  </body></html>`;
}

const raws = readdirSync(shots).filter((f) => /^(phone|ipad)-\d+-\w+\.png$/.test(f)).sort();
for (const fmt of FORMATS) {
  const [out, kind, w, h] = fmt;
  for (const raw of raws.filter((f) => f.startsWith(`${kind}-`))) {
    const [, n, name] = raw.match(/-(\d+)-(\w+)\.png$/);
    const page = join(tmp, `${kind}-${n}.html`);
    writeFileSync(page, frame(raw, CAPTIONS[name], fmt));
    const file = `${out}-${n}-${name}.png`;
    execFileSync(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files', '--force-device-scale-factor=1',
      `--window-size=${w},${h}`, `--screenshot=${join(root, file)}`, '--virtual-time-budget=2000', `file://${page}`], { stdio: 'ignore' });
    console.log(file);
  }
}
rmSync(tmp, { recursive: true });
