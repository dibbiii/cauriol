# Piano del sito Cauriol

Cauriol ASD è il primo cliente costruito sulla base `brainy-starter`.
Questo repository è un **clone della base**: il remote `base` punta a
`github.com/dibbiii/brainy-starter`, il remote `origin` a `github.com/dibbiii/cauriol`.

Fonte del design: i mockup "ASD Cauriol — Redesign sito" (HTML + PDF, 18 schermate
desktop), nella cartella `mockup/`. È **esclusa da Git** (`.gitignore`): pesa 23 MB e
resta solo sul disco, quindi chi clona il repository non la trova. In `mockup/assets/` ci
sono anche i due loghi (`cauriol-logo.png` e `cauriol-logo-white.png`, la versione
chiara per il footer), da copiare in `public/uploads/` quando si impostano i dati del
sito. La cartella non fa parte del sito: Astro costruisce solo `src/` e `public/`.

Le funzioni disponibili sono in [`funzioni-facoltative.md`](funzioni-facoltative.md); le
guide per sviluppare in [`aggiungere-un-blocco.md`](aggiungere-un-blocco.md) e
[`aggiungere-una-collezione.md`](aggiungere-una-collezione.md).

## Dove mettere le modifiche

Per non avere conflitti quando si porta un miglioramento della base
(`git fetch base` + `git merge base/main`), le personalizzazioni di Cauriol stanno in:

- `src/brand/` (decorazioni e stili)
- `src/content/`, `src/data/`, `public/uploads/` (contenuti e impostazioni)

Ciò che serve anche ad altri clienti va fatto nella **base**, non qui.

## Passi, in ordine

### 1. Creare il repository — FATTO
- Clone della base (non "Use this template"), remote `base` mantenuto, push su
  `dibbiii/cauriol`.
- `backend.repo` in `public/admin/config.yml` impostato su `dibbiii/cauriol`.
- `npm run build` sul clone: 14 pagine, nessun avviso.

### 2. Svuotare il demo — FATTO
- Cancellati: le 3 news, le 4 persone, le 3 attività e le immagini e il PDF di esempio in
  `public/uploads/` (resta un `.gitkeep`, perché Git non conserva le cartelle vuote).
- **Un segnaposto per collezione** (news, attività, persona, con testi tra parentesi quadre):
  una collezione vuota stampa un avviso a ogni build, e senza attività la voce di menu
  "Attività" porta a una pagina vuota. Si cancellano quando si inseriscono i contenuti veri
  (news dal WordPress al passo 4/6; persone e discipline al passo 4).
- `home` e `la-societa` ridotte a scheletro con testi segnaposto (i testi di esempio
  contenevano dati inventati). `la-societa` usa un blocco testo, perché il blocco
  "testo con immagine" richiede un'immagine. `contatti` e `privacy` sono ancora quelle del
  demo (da riscrivere al passo 3/4).
- Tolto `og_image` dai dati del sito (puntava a un'immagine cancellata).
- Controllo: `npm run check` 0 errori, `npm run build` 10 pagine senza avvisi.
- I segnaposto di questo passo sono stati poi sostituiti dai contenuti veri (passi 3 e 4).

### 3. Tema, dati del sito, menu e footer — FATTO
- **Tema** (`theme.json`): verde `#1e3b2f`, arancione `#c2471a`, testo `#1f2a24`, sfondo
  `#f5f6f2`, titoli Source Serif 4, testo Source Sans, angoli leggermente arrotondati.
  Valori presi dal codice del mockup.
- **Dati del sito** (`site.json`): nome, motto, contatti, C.F., logo e logo chiaro (copiati da
  `mockup/assets/` in `public/uploads/`), sottotitolo, pulsante "Tesseramento", fascia
  (`band`), condivisione, news in evidenza e colonna laterale con il riquadro "5 x mille",
  sezione "Discipline" (`/discipline/...`), colonne del footer (La società, Discipline).
- **Menu** (`menu.json`): come nel mockup; "Discipline" si riempie da sola dalle attività.
- **Da completare con il cliente**: telefono (non esiste da nessuna parte), **indirizzi dei
  social** (Facebook "A.S. Cauriol", Instagram "ASD Cauriol Ziano": sul vecchio sito i link
  sono generici), indirizzo del sito (`https://www.cauriol.it` è dedotto dall'email, non
  confermato), pagina del pulsante "Tesseramento" (oggi porta a `/contatti`).

### 4. Contenuti — FATTO (con le note sotto)
- **Team**: 15 schede dal direttivo del 2024, in due gruppi (`Cariche`, `Responsabili di
  settore`). Tania Trettel e Nicola Vanzetta hanno **due schede** (come nel mockup, che le
  mostra in entrambi i gruppi): `tania-trettel` / `tania-trettel-sci-nordico`,
  `nicola-vanzetta` / `nicola-vanzetta-orientamento`. Foto e contatti non esistono.
- **Discipline**: 7 attività con responsabili, testi dal vecchio sito. **Corsa campestre e
  Sci alpino sono vuote** anche sul vecchio sito: hanno un segnaposto. Le descrizioni brevi
  sono frasi neutre scritte a mano. Nessuna disciplina ha un'immagine.
- **Pagine**: home (testi e cifre dal mockup), la storia, il direttivo, modulistica,
  safeguarding, sponsor, vantaggi economici, discipline, contatti e tesseramento (con il
  codice QR di WhatsApp) e `classifiche-4-valli-2018` (pagina vecchia, fuori dal menu).
- **Sponsor**: sul vecchio sito sono **5 collage di ~50 loghi**, non loghi singoli. La pagina li
  mostra interi; i nomi sono nel testo alternativo. `sponsors.json` è vuoto e la home non ha il
  blocco sponsor: per il carosello del mockup servono i **loghi singoli** da Cauriol.
- **Privacy**: resta il testo segnaposto (con i dati veri del titolare). Va scritta da chi se ne
  occupa.
- **Da verificare con il cliente**: nomi dei responsabili (sul vecchio sito sono "COGNOME NOME",
  qui sono "Nome Cognome"); i 3 box della home e le cifre (1947, 74, 18, 7) sono dal mockup; il
  PDF 2021 dei "Vantaggi economici" non esiste sul vecchio sito.

### 5. Parte solo di Cauriol, in `src/brand/` — FATTO (illustrazioni)
- **Montagne e boschi** disegnati in SVG e generati da `scripts/generate-brand-art.cjs`
  (deterministico: rilanciandolo si ottengono gli stessi file; si possono cambiare forme, colori
  e densità degli abeti nello script):
  - scena della home: `public/uploads/cauriol-montagne.svg`, impostata come immagine del blocco
    hero in `src/content/pages/home.md`;
  - `src/brand/PageHeaderDecor.astro`: montagne in trasparenza dietro la fascia delle pagine
    interne (funzionano con qualunque colore primario);
  - `src/brand/FooterDecor.astro`: sagoma di montagne e abeti sopra il footer, nel colore
    primario del tema.
- Su telefono il blocco hero ritaglia l'immagine al centro: si vedono bosco e colline, non le
  cime innevate a destra. Il testo resta leggibile. Cambiarlo richiederebbe di modificare la base.
- Il mockup ha anche mini-montagne come immagine segnaposto delle discipline e delle news senza
  copertina, e un riquadro "La società" con montagne nella home: non fatti. Le discipline non hanno
  immagini (sul vecchio sito non esistono).
- Tabella gare di Orienteering e sostenitori del Calcio: contenuto di Cauriol (oggi testo nelle
  pagine delle discipline). Diventano un blocco della base solo se servono a un secondo cliente.

### 6. Pubblicazione
- Deploy su Netlify con una OAuth App di GitHub, poi gli account degli editor (vedi
  README). **Non provato**: in locale il pannello non chiede login.

## Migrazione dal vecchio sito WordPress

Il vecchio sito (`asdcauriol.wordpress.com`) è pubblico e l'API di WordPress.com risponde senza
login, quindi non serve alcun export. Lo script `scripts/migrate-wordpress.mjs` importa:

- **85 news** (2016–2026) con copertina e allegati PDF; testo convertito in Markdown con
  `turndown` (dipendenza di sviluppo). Il collegamento a una disciplina è per categoria o per
  parole nel titolo: **30 su 85** sono collegate, le altre erano "Senza categoria".
- le **7 discipline**, **La storia** e la pagina delle classifiche 2018.
- tutti i **file** in `public/uploads/wp/` (immagini e PDF: i link a wordpress.com smetteranno
  di funzionare quando il vecchio sito verrà spento) e i link tra pagine, riscritti sugli
  indirizzi nuovi. Risultato: nessun riferimento a wordpress.com nel sito costruito.

Lo script si può rilanciare (`node scripts/migrate-wordpress.mjs`): **riscrive** news e
discipline, quindi non modificarle a mano finché non si decide di chiudere la migrazione.
`node scripts/optimize-images.mjs` riduce le foto a 1600 px (da 161 MB a 26 MB; i PDF restano
41 MB: `public/uploads` pesa in tutto circa 80 MB).

Limiti noti:
- 9 PDF di classifiche 2016-2017 non esistono più nemmeno sul vecchio sito (errore 404): nei
  testi resta il nome senza link.
- Gli estratti automatici di WordPress (l'inizio dell'articolo) sono scartati: duplicavano il
  testo. Solo 1 news su 85 ne ha uno scritto a mano.
- La news "I Nostri Sponsor" (17.12.2024) è un doppione della pagina Sponsor.
- Sul vecchio sito molte foto hanno il nome del file come testo alternativo: da migliorare.

## Da chiedere a Cauriol

Dati che non si possono ricavare dal vecchio sito né dal mockup. Si spunta quando arrivano.

**Servono per pubblicare**

- [ ] **Instagram.** Nel mockup c'è solo il nome ("ASD Cauriol Ziano"): non compare in nessun
  articolo e non è trovabile online. Dove: pannello → Impostazioni → Dati del sito → Social.
- [ ] **Confermare la pagina Facebook** `https://www.facebook.com/AsCauriol/` (già inserita): è
  la pagina "A.S. Cauriol, Ziano di Fiemme", trovata in un articolo del 2018 ("a cura della A.S.
  Cauriol"); corrisponde al nome del mockup ma il cliente deve confermare che sia quella attiva.
- [ ] **Telefono dell'associazione.** Non esiste da nessuna parte. Negli articoli compaiono solo
  numeri di singole persone (es. responsabili dei corsi sui volantini): non vanno usati come
  telefono della società senza il loro consenso. Dove: Dati del sito → Telefono (oggi vuoto).
- [ ] **Indirizzo del sito.** `https://www.cauriol.it` è dedotto dall'email `info@cauriol.it`,
  da confermare. Serve per sitemap e anteprime di condivisione. Dove: Dati del sito → Indirizzo
  del sito.
- [ ] **Privacy vera.** Il testo di `src/content/pages/privacy.md` è un segnaposto: va scritta da chi si occupa della privacy dell'associazione.
- [ ] **Controllo dei nomi del direttivo.** Sul vecchio sito sono scritti "COGNOME NOME" (es.
  "VANZETTA NICOLA"); nel sito nuovo sono "Nome Cognome". Verificare che non ci siano errori, in
  particolare per i due Diego (Zorzi e Vanzetta) e per chi ha due ruoli. Dove: `src/content/team/`
  o pannello → Team.

**Servono per completare il design**

- [ ] **Loghi singoli degli sponsor.** Sul vecchio sito sono 5 collage di circa 50 loghi, non file
  separati. Per il carosello del mockup servono i file dei singoli loghi, con nome e, se c'è, il
  sito. Dove: `src/data/sponsors.json` (pannello → Impostazioni → Sponsor) e, per riattivarli,
  il blocco "Sponsor" nella home.

**Da verificare prima di pubblicare**

- [ ] **Diritti sulle immagini migrate.** Le 140 immagini in `public/uploads/wp/` vengono dal
  vecchio sito (copertine delle news, foto negli articoli, collage degli sponsor, QR di WhatsApp)
  e le ho copiate così com'erano, solo ridimensionate. Non ho verificato la proprietà né le
  liberatorie: alcuni volantini riportano loghi di altri enti, e ci sono foto di persone,
  compresi minori. Chiedere a Cauriol conferma sui diritti e sulla privacy; eventualmente
  togliere le immagini dubbie.
- [ ] **Origine delle immagini nuove.** Le montagne (`cauriol-montagne.svg`,
  `PageHeaderDecor.astro`, `FooterDecor.astro`) sono disegnate da noi, non il
  materiale del grafico: se il grafico ha le illustrazioni originali vanno usate al loro posto.
  Anche la favicon è generata dal codice (colori del tema), non è il logo di Cauriol.

**Contenuti mancanti sul vecchio sito**

- [ ] **Testi di Corsa campestre e Sci alpino**: le pagine sono vuote anche sul vecchio sito e nel
  nuovo hanno un segnaposto. In pratica la pagina di Corsa campestre non è vuota: mostra da sola
  le 12 news collegate. Sci alpino no (nessuna news si può attribuire con certezza: i "corsi di
  sci" sono insieme nordico e alpino, e una news ha una sola disciplina). Così anche Biathlon
  e Sci nordico non hanno news collegate.
- [ ] **Immagini delle discipline** (il mockup ne ha una per ciascuna) e foto o contatti delle
  persone del direttivo: non esistono sul vecchio sito.
- [ ] **Pagina o modulo per il pulsante "Tesseramento"**: oggi porta a `/contatti`. Confermare se
  basta o se serve una pagina dedicata.
- [ ] **Descrizioni brevi delle discipline**: oggi sono frasi neutre scritte a mano ("Il settore
  orienteering di ASD Cauriol."). Da sostituire con quelle del cliente.

## Da decidere con il cliente

- **Carosello degli sponsor**: il mockup lo mostra, richiede JavaScript. Nella base è una
  griglia.
- **Icone** (home, contatti, social del footer): la base non ha un sistema di icone.
- **Newsletter nel footer**: serve un servizio esterno, consenso e informativa (GDPR).
- **Schermate mobile**: non sono nel PDF.
- **Interruttore "più recenti / meno recenti"** nei documenti: richiede JavaScript.

## Promemoria

- `npm run check` dopo ogni modifica ai componenti (la build non controlla i tipi).
- Dopo un aggiornamento di esbuild: `npm approve-scripts esbuild`.
- Mai `git push base` da questo repository, a meno che non si voglia davvero modificare
  la base.
