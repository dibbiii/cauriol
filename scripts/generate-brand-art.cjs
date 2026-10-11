// Genera le illustrazioni di montagne di Cauriol: scena della home (public/uploads/cauriol-montagne.svg),
// src/brand/PageHeaderDecor.astro e src/brand/FooterDecor.astro. Disegna cime con neve e abeti in modo
// deterministico (seme fisso: stesso risultato a ogni esecuzione). Uso:  node scripts/generate-brand-art.cjs
const fs = require('fs');
const path = require('path');
const OUT = path.resolve(__dirname, "..");

function rng(seed) {
  return () => {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const r = (n) => Math.round(n);

// Cima con versante sinistro/destro irregolare. Restituisce { d, snow } (percorsi SVG).
function mountain(rand, px, py, w, base, cap = 0.24) {
  const jag = (t) => (rand() - 0.5) * w * 0.07 * (t < 0.2 ? 0.3 : 1);
  const edge = (side) => {
    const pts = [];
    for (const t of [0, 0.3, 0.55, 0.78, 1]) {
      const x = px + side * w * (1 - t) + (t > 0 && t < 1 ? jag(t) : 0);
      const y = base + (py - base) * t;
      pts.push([x, y]);
    }
    return pts;
  };
  const L = edge(-1), R = edge(1);
  const outline = [...L, ...R.reverse().slice(1)]; // base sx → cima → base dx
  const d = 'M' + outline.map((p) => r(p[0]) + ' ' + r(p[1])).join('L') + `L${r(px + w)} ${r(base)}Z`;
  // calotta di neve: tra la cima e il punto a "cap" del versante, con bordo a denti
  const h = (base - py) * cap;
  const lx = px - w * cap * 1.05, rx = px + w * cap * 1.05;
  const zig = [];
  const n = 5;
  for (let i = 0; i <= n; i++) {
    const x = lx + ((rx - lx) * i) / n;
    zig.push([x, py + h * (i % 2 ? 0.72 : 1.0) + (rand() - 0.5) * h * 0.12]);
  }
  const snow = `M${r(px)} ${r(py)}L${zig.map((p) => r(p[0]) + ' ' + r(p[1])).join('L')}Z`;
  return { d, snow };
}

// Abete: tre piani di triangoli. (x, y) = piede del tronco.
function pine(x, y, h, w) {
  const t = (cy, hw, ch) => `M${r(x - hw)} ${r(cy)}L${r(x)} ${r(cy - ch)}L${r(x + hw)} ${r(cy)}Z`;
  return t(y - h * 0.05, w * 0.5, h * 0.5) + t(y - h * 0.3, w * 0.4, h * 0.45) + t(y - h * 0.52, w * 0.3, h * 0.48);
}
function forest(rand, x0, x1, ridge, hMin, hMax, gap) {
  let d = '';
  for (let x = x0; x <= x1; x += gap * (0.6 + rand() * 0.9)) {
    const h = hMin + rand() * (hMax - hMin);
    d += pine(x, ridge(x) + h * 0.12, h, h * 0.42);
  }
  return d;
}

// ---------- 1. Scena della home (hero) ----------
{
  const rand = rng(1947);
  const W = 1440, H = 640;
  const far = [[1010, 262, 250], [1190, 178, 300], [1380, 262, 240], [1500, 300, 200]].map((m) => mountain(rand, m[0], m[1], m[2], 560));
  const mid = [[880, 350, 230], [1230, 352, 260], [1430, 345, 220]].map((m) => mountain(rand, m[0], m[1], m[2], 580, 0.0));
  const dark = [[60, 235, 380], [340, 300, 330], [590, 372, 290]].map((m) => mountain(rand, m[0], m[1], m[2], 580, 0.0));
  const ridgeBack = (x) => 500 + Math.sin(x / 170) * 18 + Math.sin(x / 61) * 6;
  const ridgeFront = (x) => 575 + Math.sin(x / 130 + 1) * 14 + Math.sin(x / 47) * 5;
  const hills = `M0 ${H}L0 ${r(ridgeBack(0) + 6)}` + Array.from({ length: 73 }, (_, i) => `L${i * 20} ${r(ridgeBack(i * 20) + 6)}`).join('') + `L${W} ${H}Z`;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">
<defs>
<linearGradient id="sky" x1="0" y1="0" x2="1" y2="0.25"><stop offset="0" stop-color="#1e3b2f"/><stop offset=".5" stop-color="#2f4f41"/><stop offset=".76" stop-color="#9db1a6"/><stop offset="1" stop-color="#efe3cb"/></linearGradient>
<radialGradient id="sun" cx="1180" cy="118" r="300" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#fff4da" stop-opacity=".95"/><stop offset=".35" stop-color="#fbe6bf" stop-opacity=".55"/><stop offset="1" stop-color="#fbe6bf" stop-opacity="0"/></radialGradient>
<linearGradient id="haze" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#cfd9d3" stop-opacity=".45"/></linearGradient>
</defs>
<rect width="${W}" height="${H}" fill="url(#sky)"/>
<rect width="${W}" height="${H}" fill="url(#sun)"/>
<circle cx="1180" cy="118" r="34" fill="#fff6e2" opacity=".9"/>
<g fill="#a9bcc5">${far.map((m) => `<path d="${m.d}"/>`).join('')}</g>
<g fill="#ffffff" opacity=".92">${far.map((m) => `<path d="${m.snow}"/>`).join('')}</g>
<rect y="330" width="${W}" height="230" fill="url(#haze)"/>
<g fill="#7f998d">${mid.map((m) => `<path d="${m.d}"/>`).join('')}</g>
<g fill="#26453a">${dark.map((m) => `<path d="${m.d}"/>`).join('')}</g>
<path fill="#4a6a5a" d="${hills}"/>
<path fill="#2f5240" d="${forest(rand, 0, W, ridgeBack, 34, 62, 15)}"/>
<path fill="#1a3328" d="M0 ${H}L0 ${r(ridgeFront(0))}${Array.from({ length: 73 }, (_, i) => `L${i * 20} ${r(ridgeFront(i * 20))}`).join('')}L${W} ${H}Z"/>
<path fill="#1a3328" d="${forest(rand, 0, W, ridgeFront, 48, 92, 14)}"/>
</svg>
`;
  fs.writeFileSync(path.join(OUT, 'public/uploads/cauriol-montagne.svg'), svg);
  console.log('hero svg', (svg.length / 1024).toFixed(1), 'KB');
}

// ---------- 2. Fascia delle pagine interne ----------
{
  const rand = rng(2024);
  const W = 1440, H = 240;
  const back = [[210, 120, 250], [520, 80, 300], [900, 60, 330], [1290, 100, 280]].map((m) => mountain(rand, m[0], m[1], m[2], 210, 0.26));
  const front = [[40, 150, 260], [380, 128, 230], [760, 140, 300], [1120, 120, 260], [1440, 150, 220]].map((m) => mountain(rand, m[0], m[1], m[2], 215, 0.0));
  const ridge = (x) => 218 + Math.sin(x / 90) * 5;
  const body = `<svg class="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
<g fill="#fff" fill-opacity=".07">${back.map((m) => `<path d="${m.d}"/>`).join('')}</g>
<g fill="#fff" fill-opacity=".22">${back.map((m) => `<path d="${m.snow}"/>`).join('')}</g>
<g fill="#fff" fill-opacity=".05">${front.map((m) => `<path d="${m.d}"/>`).join('')}</g>
<path style="fill:var(--c-ink)" fill-opacity=".4" d="${forest(rand, 0, W, ridge, 14, 30, 11)}M0 ${H}L0 ${r(ridge(0))}L${W} ${r(ridge(W))}L${W} ${H}Z"/>
</svg>`;
  const file = `---
// Montagne di Cauriol dietro la fascia delle pagine interne (illustrazione generata, vedi il piano).
// Colori in trasparenza: funziona con qualunque colore primario scelto nel pannello.
---
${body}
`;
  fs.writeFileSync(path.join(OUT, 'src/brand/PageHeaderDecor.astro'), file);
  console.log('header decor', (file.length / 1024).toFixed(1), 'KB');
}

// ---------- 3. Sagoma sopra il footer ----------
{
  const rand = rng(1978);
  const W = 1440, H = 150;
  const back = [[150, 60, 260], [470, 35, 300], [840, 55, 330], [1220, 30, 300]].map((m) => mountain(rand, m[0], m[1], m[2], 140, 0.0));
  const mid = [[0, 80, 260], [330, 70, 250], [700, 88, 300], [1060, 66, 260], [1400, 84, 250]].map((m) => mountain(rand, m[0], m[1], m[2], 142, 0.0));
  const ridge = (x) => 132 + Math.sin(x / 80) * 4;
  const svg = `<svg class="block h-[clamp(3.5rem,9vw,7.5rem)] w-full" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true" focusable="false">
<g style="fill:var(--c-primary)" fill-opacity=".38">${back.map((m) => `<path d="${m.d}"/>`).join('')}</g>
<g style="fill:var(--c-primary)" fill-opacity=".68">${mid.map((m) => `<path d="${m.d}"/>`).join('')}</g>
<path style="fill:var(--c-primary)" d="${forest(rand, 0, W, ridge, 22, 52, 12)}M0 ${H}L0 ${r(ridge(0))}L${W} ${r(ridge(W))}L${W} ${H}Z"/>
</svg>`;
  const file = `---
// Sagoma di montagne e abeti sopra il piè di pagina (illustrazione generata, vedi il piano).
// Usa il colore primario del tema: si fonde con il footer qualunque sia il colore scelto.
---
<div class="-mb-px leading-[0]">
${svg}
</div>
`;
  fs.writeFileSync(path.join(OUT, 'src/brand/FooterDecor.astro'), file);
  console.log('footer decor', (file.length / 1024).toFixed(1), 'KB');
}
