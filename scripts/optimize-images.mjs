// Riduce le foto in public/uploads (le foto da telefono pesano 4-6 MB e sono larghe 4000 px).
// Ridimensiona a 1600 px di larghezza al massimo e ricomprime in JPEG: il nome del file non
// cambia, quindi i riferimenti nelle pagine restano validi. Tocca solo i JPEG più larghi di
// 1600 px o più pesanti di 600 KB; i PNG e i PDF non vengono modificati.
//
// Uso:  node scripts/optimize-images.mjs
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'uploads');
const MAX_WIDTH = 1600;
const MAX_BYTES = 600 * 1024;

async function* walk(dir) {
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else yield p;
  }
}

let before = 0, after = 0, changed = 0;
for await (const file of walk(ROOT)) {
  if (!/\.jpe?g$/i.test(file)) continue;
  const { size } = await fs.stat(file);
  before += size;
  try {
    const img = sharp(await fs.readFile(file)); // dal buffer: su Windows sharp non apre bene i percorsi
    const { width } = await img.metadata();
    if (width <= MAX_WIDTH && size <= MAX_BYTES) { after += size; continue; }
    const out = await img
      .rotate() // applica l'orientamento EXIF prima di toglierlo
      .resize({ width: MAX_WIDTH, withoutEnlargement: true })
      .jpeg({ quality: 80, mozjpeg: true })
      .toBuffer();
    if (out.length < size) { await fs.writeFile(file, out); after += out.length; changed++; }
    else after += size;
  } catch (e) {
    after += size;
    console.log(`  ✗ ${path.relative(ROOT, file)}: ${e.message}`);
  }
}
const mb = (n) => (n / 1048576).toFixed(1);
console.log(`JPEG ottimizzati: ${changed}. Da ${mb(before)} MB a ${mb(after)} MB.`);
