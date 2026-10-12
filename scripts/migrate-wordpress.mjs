// Importa dal vecchio sito WordPress.com di Cauriol: news, discipline e la pagina "La storia".
// Scarica anche immagini e PDF in public/uploads/wp/ (i link a wordpress.com smetteranno di
// funzionare quando il vecchio sito verrà spento).
//
// Uso:  node scripts/migrate-wordpress.mjs            (news + discipline + storia)
//       node scripts/migrate-wordpress.mjs --assets   (scarica anche i file delle altre pagine)
//
// Si può rilanciare: i file già scaricati vengono saltati, le news e le discipline vengono riscritte.
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import TurndownService from 'turndown';

const SITE = 'asdcauriol.wordpress.com';
const API = `https://public-api.wordpress.com/wp/v2/sites/${SITE}`;
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const UPLOADS = path.join(ROOT, 'public', 'uploads', 'wp');

// ---------- Cosa diventa cosa ----------
// Discipline: pagina WordPress → file in src/content/activities. "managers" sono gli id (nomi dei
// file) delle persone in src/content/team, presi dalla pagina "Il direttivo in carica".
const ACTIVITIES = [
  { wp: 'biathlon', id: 'biathlon', title: 'Biathlon', order: 1, managers: [], description: 'Il settore biathlon, nato con la stagione 2019-2020.' },
  { wp: 'calcio', id: 'calcio', title: 'Calcio', order: 2, managers: ['alberto-vanzetta'], description: 'Il settore calcio e i suoi sostenitori.' },
  { wp: 'corsa-campestre', id: 'corsa-campestre', title: 'Corsa campestre', order: 3, managers: ['sabrina-valle'] },
  { wp: 'sci-alpinismo', id: 'sci-alpinismo', title: 'Sci alpinismo', order: 4, managers: ['mauro-delvai', 'stefania-zanon'], description: 'Il settore sci alpinismo di ASD Cauriol.' },
  { wp: 'sci-alpino', id: 'sci-alpino', title: 'Sci alpino', order: 5, managers: ['massimo-vanzetta'] },
  { wp: 'sci-nordico', id: 'sci-nordico', title: 'Sci nordico', order: 6, managers: ['tania-trettel'], description: 'Le squadre di sci nordico: Baby-Cuccioli e Ragazzi-Allievi.' },
  { wp: 'orienteering', id: 'orienteering', title: 'Orienteering', order: 7, managers: ['nicola-vanzetta'], description: 'Il settore orienteering di ASD Cauriol.' },
];
// (senza "description" si usa il segnaposto: la pagina sul vecchio sito è vuota)

// Collegamento news → disciplina: prima per categoria WordPress, poi per parole nel titolo.
const CATEGORY_TO_ACTIVITY = {
  9156: 'calcio', // CALCIO
  7209902: 'corsa-campestre', // CORSA IN MONTAGNA
  178042308: 'orienteering', // ORIENTAMENTO - ORIENTEERING
  2234005: 'sci-alpinismo', // SCI ALPINISMO
};
const TITLE_RULES = [
  [/orienteering|orientamento/i, 'orienteering'],
  [/ski ?alp|sci ?alpinismo/i, 'sci-alpinismo'],
  [/corsa campestre/i, 'corsa-campestre'],
  [/\bcalcio\b/i, 'calcio'],
];

// Pagine con file da scaricare ma scritte a mano (vedi src/content/pages e src/data/sponsors.json).
const ASSET_PAGES = ['i-nostri-sponsor', 'safeguarding', 'vantaggi-economici-da-pubbliche-amministrazioni', 'tesseramento', 'contatti'];

// ---------- Utilità ----------
const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', ndash: '–', mdash: '—', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“' };
const decode = (s) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => ENTITIES[n.toLowerCase()] ?? m)
    .replace(/ /g, ' ');
const stripTags = (h) => decode(h.replace(/<style[\s\S]*?<\/style>/g, '').replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim();
const slugify = (s) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/g, '');
const q = (s) => JSON.stringify(s); // una stringa JSON è anche una stringa YAML valida
const block = (text, indent) => text.split('\n').map((l) => (l.trim() ? ' '.repeat(indent) + l : '')).join('\n');

async function getAll(endpoint, params = '') {
  const out = [];
  for (let page = 1; ; page++) {
    const res = await fetch(`${API}/${endpoint}?per_page=100&page=${page}${params}`);
    if (res.status === 400) break; // pagina oltre l'ultima
    if (!res.ok) throw new Error(`${endpoint}: HTTP ${res.status}`);
    const items = await res.json();
    out.push(...items);
    if (items.length < 100) break;
  }
  return out;
}

// ---------- Scaricamento file ----------
const URL_RE = /https?:\/\/[^"'\s)<>]*?(?:wp-content\/uploads|files\.wordpress\.com)\/[^"'\s)<>]*/g;
const localPathFor = (url) => {
  const clean = decodeURIComponent(url.split('?')[0]);
  const rel = clean.split(/wp-content\/uploads\/|files\.wordpress\.com\//)[1];
  return rel.replace(/[^A-Za-z0-9._/-]+/g, '-');
};
const cache = new Map(); // url pulito → promessa del percorso pubblico (/uploads/wp/...) o null se fallito
const resolved = new Map(); // url pulito → percorso pubblico già scaricato
let downloaded = 0, skipped = 0, failed = [];

async function fetchAsset(rawUrl) {
  const url = rawUrl.split('?')[0];
  if (!cache.has(url)) cache.set(url, download(url).then((r) => (r && resolved.set(url, r), r)));
  return cache.get(url);
}

async function download(url) {
  const rel = localPathFor(url);
  const dest = path.join(UPLOADS, rel);
  const pub = '/uploads/wp/' + rel;
  return (async () => {
    try {
      await fs.access(dest);
      skipped++;
      return pub;
    } catch {}
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error('HTTP ' + res.status);
        await fs.mkdir(path.dirname(dest), { recursive: true });
        await fs.writeFile(dest, Buffer.from(await res.arrayBuffer()));
        downloaded++;
        return pub;
      } catch (e) {
        if (attempt === 3) { failed.push(`${url} (${e.message})`); return null; }
      }
    }
  })();
}

async function inPool(items, size, fn) {
  const queue = [...items];
  await Promise.all(Array.from({ length: size }, async () => { while (queue.length) await fn(queue.shift()); }));
}

// Scarica tutti i file di un pezzo di HTML e riscrive gli indirizzi su quelli locali.
async function localize(html) {
  const urls = [...new Set([...html.matchAll(URL_RE)].map((m) => m[0].split('?')[0]))];
  await inPool(urls, 6, fetchAsset);
  return fixLinks(html.replace(URL_RE, (m) => resolved.get(m.split('?')[0]) ?? m));
}

// Percorso sul vecchio sito (es. /2026/04/30/estate-sport-2026/) → indirizzo nuovo. Lo riempie l'avvio.
const LINKS = new Map();
function fixLinks(html) {
  return html
    // link attorno a un'immagine verso la "pagina allegato" di WordPress: resta solo l'immagine
    .replace(/<a\b[^>]*href="https?:\/\/asdcauriol\.wordpress\.com\/(?!wp-content)[^"]*"[^>]*>\s*(?:<meta\b[^>]*>\s*)*(<img\b[^>]*>)\s*<\/a>/g, '$1')
    // link a pagine e articoli del vecchio sito: indirizzo nuovo
    .replace(/(<a\b[^>]*\bhref=")https?:\/\/asdcauriol\.wordpress\.com(\/[^"#]*)(#[^"]*)?(")/g, (m, a, p, h, c) => {
      const target = LINKS.get(p.replace(/\/?$/, '/'));
      return target ? a + target + (h ?? '') + c : m;
    })
    // file che non esistono più sul vecchio sito (404): resta il testo, senza link
    .replace(/<a\b[^>]*href="https?:\/\/[^"]*wp-content\/uploads[^"]*"[^>]*>([\s\S]*?)<\/a>/g, '$1');
}

// ---------- HTML → Markdown ----------
const td = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-', codeBlockStyle: 'fenced', emDelimiter: '*' });
td.addRule('rows', {
  filter: 'tr',
  replacement: (_, node) => {
    const cells = [...node.querySelectorAll('td,th')].map((c) => c.textContent.replace(/\s+/g, ' ').trim()).filter(Boolean);
    return cells.length ? '\n\n' + cells.join(' · ') + '\n\n' : '';
  },
});
td.addRule('dropEmbedsAndStyle', { filter: ['style', 'script', 'object', 'iframe', 'meta'], replacement: () => '' });
// Il pannello (Sveltia) non sa rappresentare le linee orizzontali: salvando una voce che ne
// contiene una la riscriverebbe come elenco con asterischi letterali. Sono solo separatori di
// WordPress, quindi si tolgono (lasciando una riga vuota).
td.addRule('noHorizontalRules', { filter: 'hr', replacement: () => '\n\n' });

// Estrae i blocchi "File" di WordPress (pulsante Scarica) come allegati e li toglie dal testo.
function takeAttachments(html) {
  const attachments = [];
  const out = html.replace(/<div[^>]*class="[^"]*wp-block-file[^"]*"[^>]*>[\s\S]*?<\/div>/g, (blk) => {
    const a = blk.match(/<a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/);
    if (a && !/wp-block-file__button/.test(a[0])) {
      const label = stripTags(a[2]);
      if (label) attachments.push({ label, file: a[1] });
    }
    return '';
  });
  return { html: out, attachments };
}

// Stesso motivo per un titolo dentro una citazione ("> ### Titolo"): il pannello lo riscriverebbe
// con il simbolo del titolo letterale ("> \### Titolo"). Il titolo si porta fuori dalla citazione.
const toMarkdown = (html) =>
  td.turndown(html).replace(/^> (#{1,6} )/gm, '$1').replace(/\n{3,}/g, '\n\n').replace(/^\s*(?:&nbsp;| )\s*$/gm, '').trim();

// ---------- News ----------
const titleOf = (p) => stripTags(p.title.rendered) || `Articolo ${p.id}`;

// Nome del file di ogni news (data + titolo), deciso prima di convertire: serve a riscrivere
// i link tra un articolo e l'altro.
function planNames(posts) {
  const used = new Set();
  const names = new Map();
  for (const p of posts) {
    let name = `${p.date.slice(0, 10)}-${slugify(titleOf(p)) || p.id}`;
    while (used.has(name)) name += '-2';
    used.add(name);
    names.set(p.id, name);
  }
  return names;
}

async function migrateNews(posts, names) {
  console.log(`News: ${posts.length} articoli`);
  const dir = path.join(ROOT, 'src', 'content', 'news');
  await fs.mkdir(dir, { recursive: true });
  for (const f of await fs.readdir(dir)) if (f.endsWith('.md')) await fs.unlink(path.join(dir, f));

  const stats = { cover: 0, attachments: 0, activity: 0 };
  const files = [];
  for (const p of posts) {
    const title = titleOf(p);
    const date = p.date.slice(0, 10);
    const name = names.get(p.id);

    const { html: noFiles, attachments } = takeAttachments(p.content.rendered);
    const localHtml = await localize(noFiles);
    const body = toMarkdown(localHtml);

    const media = p._embedded?.['wp:featuredmedia']?.[0];
    let cover = null;
    if (media?.source_url) cover = await fetchAsset(media.source_url);
    const coverAlt = media?.alt_text ? stripTags(media.alt_text) : '';

    const atts = [];
    for (const a of attachments) {
      const f = await fetchAsset(a.file);
      if (f) atts.push({ label: a.label, file: f });
    }

    // L'estratto di WordPress è quasi sempre l'inizio dell'articolo, generato in automatico: se lo
    // tenessimo comparirebbe due volte nella pagina. Si conserva solo quando l'ha scritto qualcuno.
    let excerpt = stripTags(p.excerpt.rendered).replace(/\s*\[…\]\s*$/, '…');
    const start = excerpt.replace(/…$/, '').trim().slice(0, 60);
    if (!start || stripTags(p.content.rendered).startsWith(start)) excerpt = '';

    let activity = p.categories.map((c) => CATEGORY_TO_ACTIVITY[c]).find(Boolean);
    activity ??= TITLE_RULES.find(([re]) => re.test(title))?.[1];

    let fm = `---\ntitle: ${q(title)}\ndate: ${date}\n`;
    if (excerpt) fm += `excerpt: ${q(excerpt)}\n`;
    if (cover) { fm += `cover: ${q(cover)}\n`; stats.cover++; }
    if (cover && coverAlt) fm += `cover_alt: ${q(coverAlt)}\n`;
    if (activity) { fm += `activity: ${q(activity)}\n`; stats.activity++; }
    if (atts.length) {
      fm += 'attachments:\n' + atts.map((a) => `  - label: ${q(a.label)}\n    file: ${q(a.file)}\n`).join('');
      stats.attachments += atts.length;
    }
    fm += 'draft: false\n---\n';
    await fs.writeFile(path.join(dir, name + '.md'), fm + (body ? body + '\n' : ''));
    files.push(name);
  }
  console.log(`  con copertina: ${stats.cover}, allegati: ${stats.attachments}, collegate a una disciplina: ${stats.activity}`);
}

// ---------- Discipline e pagina "La storia" ----------
const firstSentence = (text) => {
  const t = text.replace(/\s+/g, ' ').trim();
  const m = t.match(/^(.{40,200}?[.!?])(\s|$)/);
  return (m ? m[1] : t.slice(0, 160)).trim();
};

async function migrateActivities(pages) {
  const dir = path.join(ROOT, 'src', 'content', 'activities');
  await fs.mkdir(dir, { recursive: true });
  for (const f of await fs.readdir(dir)) if (f.endsWith('.md')) await fs.unlink(path.join(dir, f));
  for (const a of ACTIVITIES) {
    const page = pages.find((p) => p.slug === a.wp);
    const html = page ? await localize(takeAttachments(page.content.rendered).html) : '';
    const body = toMarkdown(html);
    const text = stripTags(html);
    const empty = !body;
    const description = a.description ?? (empty ? '[Descrizione da scrivere con il cliente.]' : firstSentence(text));
    const content = empty ? '[Contenuto da inserire: la pagina sul vecchio sito è vuota.]' : body;
    const fm =
      `---\ntitle: ${q(a.title)}\ndescription: ${q(description)}\norder: ${a.order}\n` +
      (a.managers.length ? 'managers:\n' + a.managers.map((m) => `  - ${m}\n`).join('') : '') +
      `sections:\n  - type: text\n    content: |\n${block(content, 6)}\n---\n`;
    await fs.writeFile(path.join(dir, a.id + '.md'), fm);
    console.log(`  disciplina ${a.id}${empty ? ' (vuota sul vecchio sito)' : ''}`);
  }
}

// Pagina del vecchio sito → pagina con un solo blocco di testo.
async function migrateTextPage(pages, wpSlug, file, title, description) {
  const page = pages.find((p) => p.slug === wpSlug);
  const body = toMarkdown(await localize(page.content.rendered));
  const fm = `---\ntitle: ${q(title)}\ndescription: ${q(description)}\nshow_title: true\nsections:\n  - type: text\n    content: |\n${block(body, 6)}\n---\n`;
  await fs.writeFile(path.join(ROOT, 'src', 'content', 'pages', file + '.md'), fm);
  console.log(`  pagina ${file}`);
}

const migrateStory = (pages) =>
  migrateTextPage(pages, 'la-storia-della-societa', 'la-storia', 'La storia', "Cenni sulla storia dell'associazione, dalla fondazione nel 1947.");

async function downloadPageAssets(pages) {
  for (const slug of ASSET_PAGES) {
    const page = pages.find((p) => p.slug === slug);
    const urls = [...new Set([...page.content.rendered.matchAll(URL_RE)].map((m) => m[0].split('?')[0]))];
    await inPool(urls, 6, fetchAsset);
    console.log(`  ${slug}:`);
    for (const u of urls) console.log(`    ${resolved.get(u) ?? 'NON SCARICATO'}  ←  ${u}`);
  }
}

// ---------- Avvio ----------
const pages = await getAll('pages', '&_fields=id,slug,title,content,link');
const posts = await getAll('posts', '&_embed=wp:featuredmedia&_fields=id,date,slug,title,excerpt,content,categories,link,_links,_embedded');
console.log(`Pagine: ${pages.length}`);
const names = planNames(posts);

// Tabella dei link tra pagine e articoli del vecchio sito
LINKS.set('/', '/');
for (const p of posts) LINKS.set(new URL(p.link).pathname.replace(/\/?$/, '/'), `/news/${names.get(p.id)}`);
const PAGE_URLS = {
  'la-storia-della-societa': '/la-storia', 'il-direttivo-in-carica': '/il-direttivo', tesseramento: '/modulistica',
  contatti: '/contatti', safeguarding: '/safeguarding', 'i-nostri-sponsor': '/sponsor',
  'vantaggi-economici-da-pubbliche-amministrazioni': '/vantaggi-economici', 'classifiche-4-valli-2018': '/classifiche-4-valli-2018',
  ...Object.fromEntries(ACTIVITIES.map((a) => [a.wp, `/discipline/${a.id}`])),
};
for (const [slug, url] of Object.entries(PAGE_URLS)) {
  const page = pages.find((p) => p.slug === slug);
  if (page) LINKS.set(new URL(page.link ?? `https://${SITE}/${slug}/`).pathname.replace(/\/?$/, '/'), url);
  LINKS.set(`/${slug}/`, url);
}

await migrateNews(posts, names);
console.log('Discipline e pagine:');
await migrateActivities(pages);
await migrateStory(pages);
await migrateTextPage(pages, 'classifiche-4-valli-2018', 'classifiche-4-valli-2018', 'Classifiche 4 valli 2018', 'Classifiche delle gare del 2018.');
if (process.argv.includes('--assets')) {
  console.log('File delle altre pagine:');
  await downloadPageAssets(pages);
}
console.log(`\nFile scaricati: ${downloaded}, già presenti: ${skipped}, falliti: ${failed.length}`);
for (const f of failed) console.log('  ✗ ' + f);
