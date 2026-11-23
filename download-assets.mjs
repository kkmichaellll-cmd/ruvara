// Optional. Run "node download-assets.mjs" once to make the website work offline.
// Requires Node.js 20 or later. Use the HTML, CSS and JavaScript directly for normal online hosting.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.dirname(fileURLToPath(import.meta.url));
const imageUrls = {
  "macro": "https://media.base44.com/images/public/6a524b6e5fa4048bdc137864/74d39003e_generated_9dc83c86.png",
  "studio": "https://media.base44.com/images/public/6a524b6e5fa4048bdc137864/6a145ccd1_generated_3e40f7c4.png",
  "nude": "https://media.base44.com/images/public/6a524b6e5fa4048bdc137864/b97de28da_generated_ac9e2620.png",
  "espresso": "https://media.base44.com/images/public/6a524b6e5fa4048bdc137864/3c05b6ab8_generated_1ae0e5b4.png",
  "art": "https://media.base44.com/images/public/6a524b6e5fa4048bdc137864/ddfbf7723_generated_5fe4a5c5.png",
  "french": "https://media.base44.com/images/public/6a524b6e5fa4048bdc137864/894a808c4_generated_f368aa02.png",
  "pedicure": "https://media.base44.com/images/public/6a524b6e5fa4048bdc137864/8dcd69129_generated_7aad9743.png",
  "polish": "https://media.base44.com/images/public/6a524b6e5fa4048bdc137864/05233a3e3_generated_21d4986e.png",
  "stylist": "https://media.base44.com/images/public/6a524b6e5fa4048bdc137864/c68d70b4b_generated_cae4af5d.png"
};
const fontUrls = {
  "bodoni": "https://cdn.jsdelivr.net/npm/@fontsource-variable/bodoni-moda@5/files/bodoni-moda-latin-wght-normal.woff2",
  "bodoni-italic": "https://cdn.jsdelivr.net/npm/@fontsource-variable/bodoni-moda@5/files/bodoni-moda-latin-wght-italic.woff2",
  "dm-sans": "https://cdn.jsdelivr.net/npm/@fontsource-variable/dm-sans@5/files/dm-sans-latin-wght-normal.woff2"
};
let html = await fs.readFile(path.join(root, 'index.html'), 'utf8');
let css = await fs.readFile(path.join(root, 'styles.css'), 'utf8');
let failed = 0;
await fs.mkdir(path.join(root, 'assets/fonts'), {recursive:true});
async function save(name, url, isFont) {
  const response = await fetch(url, {signal:AbortSignal.timeout(40000)});
  if (!response.ok) throw new Error('HTTP ' + response.status);
  const bytes = new Uint8Array(await response.arrayBuffer());
  let extension;
  if (isFont && bytes[0] === 119 && bytes[1] === 79) extension = 'woff2';
  else if (bytes[0] === 137 && bytes[1] === 80) extension = 'png';
  else if (bytes[0] === 255 && bytes[1] === 216) extension = 'jpg';
  else if (bytes[0] === 82 && bytes[1] === 73) extension = 'webp';
  else throw new Error('Unexpected file type');
  const local = (isFont ? 'assets/fonts/' : 'assets/') + name + '.' + extension;
  await fs.writeFile(path.join(root, local), bytes);
  html = html.replaceAll(url, local);
  css = css.replaceAll(url, local);
  console.log('Saved ' + local);
}
for (const [group, items] of [['image', imageUrls], ['font', fontUrls]]) {
  await Promise.all(Object.entries(items).map(async ([name,url]) => {
    if (!html.includes(url) && !css.includes(url)) return;
    try { await save(name,url,group === 'font'); }
    catch (error) { failed++; console.error(name + ': ' + error.message); }
  }));
}
await fs.writeFile(path.join(root,'index.html'), html);
await fs.writeFile(path.join(root,'styles.css'), css);
if (failed) { console.log('Unreachable assets keep their online URLs. Run again to retry.'); process.exitCode=1; }
else console.log('All photos and fonts are local. Open index.html.');
