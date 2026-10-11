// Copies the web app into www/, the folder Capacitor packages into the iOS and Android apps.
import { cpSync, rmSync, mkdirSync } from 'node:fs';

const OUT = 'www';
const ITEMS = ['index.html', 'manifest.webmanifest', 'sw.js', 'css', 'fonts', 'icons', 'js'];

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT);
for (const item of ITEMS) cpSync(item, `${OUT}/${item}`, { recursive: true });
console.log(`Copied ${ITEMS.length} items into ${OUT}/`);
