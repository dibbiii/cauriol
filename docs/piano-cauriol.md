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
- Menu: tolta la voce "Modulistica" (puntava a `#documenti`, blocco non più presente); resta
  "Il direttivo" (`/la-societa#team`). Si rifà il menu definitivo al passo 3.
- Il resto dei dati demo (`site.json`: "ASD Monte Esempio", contatti, social; `menu.json`;
  `sponsors.json`; `theme.json`) si sostituisce al passo 3.

### 3. Configurare dal pannello (`npm run dev` + `npm run cms`, poi `/admin`)
- **Aspetto**: colori e caratteri dal PDF; titoli in Source Serif 4.
- **Dati del sito**: nome, contatti, social, logo e logo chiaro per il footer, motto,
  pulsante "Tesseramento" nell'intestazione, `page_header_style: band`, condivisione,
  news in evidenza, colonna laterale.
- **Menu**: struttura del mockup, con "Attività" alimentata in automatico.
- **Footer**: colonne di link.

### 4. Contenuti
- **Team**: cariche e responsabili di settore (una persona per file, con il gruppo giusto).
- **Attività**: le 7 discipline, con responsabili scelti dal Team.
- **Pagine** a blocchi: Home, La società, La storia, Vantaggi economici e le altre.
- **Privacy**: il testo vero (oggi c'è un segnaposto).

### 5. Parte solo di Cauriol, in `src/brand/`
- Montagne e boschi illustrati: `PageHeaderDecor.astro` (dietro la fascia) e
  `FooterDecor.astro` (sopra il footer); stili in `brand.css`.
- Tabella gare di Orienteering e sostenitori del Calcio: contenuto di Cauriol. Diventano
  un blocco della base solo se servono a un secondo cliente.

### 6. Pubblicazione
- Deploy su Netlify con una OAuth App di GitHub, poi gli account degli editor (vedi
  README). **Non provato**: in locale il pannello non chiede login.

## Segnaposto finché non c'è il WordPress

Il WordPress non è ancora disponibile. Finché manca, si usano testi tipo
«[da WordPress]» con il blocco già al suo posto, da sostituire poi:

- **News**: circa 48 articoli dal 2019. Serve uno script di migrazione
  WordPress → Markdown, adattato allo schema delle news (data, titolo, immagine,
  attività collegata).
- **Testi e immagini reali**: nel mockup ci sono solo segnaposto
  ("[TESTO DELL'ARTICOLO]", "[NOME SOSTENITORE]").

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
