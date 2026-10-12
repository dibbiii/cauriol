# Aggiungere un blocco alla base

Un **blocco** è un tipo di sezione che l'editor può aggiungere a una pagina dal
pannello (`/admin`): testo, schede, numeri, ecc. Questa guida descrive come si
crea, usando come esempio il blocco **Numeri** (`stats`).

## Quando serve un blocco nella base

- **Sì**, se serve (o servirà) a più di un cliente: va nella base.
- **No**, se è un disegno particolare di un solo cliente: si fa nel repository
  del cliente, con le sue classi e i suoi campi.

## I 4 file

Ogni blocco tocca sempre gli stessi 4 file. Se ne salti uno, il blocco non
funziona (vedi "Cosa succede se manca un file").

| # | File | Compito |
|---|------|---------|
| 1 | `public/admin/config.yml` | Il **modulo** che l'editor compila nel pannello |
| 2 | `src/content.config.ts` | Lo **schema**: quali campi sono validi (controllato dalla build) |
| 3 | `src/components/blocks/Nome.astro` | Il **disegno** del blocco (HTML + Tailwind) |
| 4 | `src/components/Blocks.astro` | Il **collegamento** tra `type` e componente |

I file 1 e 2 sono gemelli: devono descrivere gli stessi campi.

### 1. `config.yml`: il modulo

Dentro `collections → pages → fields → sections → types`, un nuovo elemento:

```yaml
          - label: Numeri
            name: stats                  # è il "type" che finirà nel file .md
            widget: object
            summary: "{{fields.title}}"
            fields:
              - { label: Titolo, name: title, widget: string, required: false }
              - label: Aspetto
                name: layout
                widget: select
                default: row
                options:
                  - { label: "In riga, divisi da filetti", value: row }
                  - { label: "Schede separate", value: cards }
              - label: Numeri
                name: items
                widget: list
                min: 2
                max: 4
                summary: "{{fields.value}} — {{fields.label}}"
                fields:
                  - { label: Numero, name: value, widget: string, hint: "..." }
                  - { label: Descrizione, name: label, widget: string, hint: "..." }
```

### 2. `content.config.ts`: lo schema

Uno schema con lo stesso `type`, e poi si aggiunge alla lista `section`:

```ts
const stats = z.object({
  type: z.literal('stats'),
  title: optStr,
  layout: z.enum(['row', 'cards']).default('row'),
  items: z.array(z.object({ value: z.string(), label: z.string() })).min(2).max(4),
});

export const section = z.discriminatedUnion('type', [
  hero, text, /* ... */ stats, /* ... */ contacts,
]);
```

### 3. Il componente

`src/components/blocks/Stats.astro`. Riceve i campi come proprietà
(`Astro.props`) e usa i gruppi di classi di `src/lib/ui.ts` (`wrap`,
`section`, ...) per avere gli stessi margini degli altri blocchi.

### 4. `Blocks.astro`: il collegamento

Un `import` e una voce nella mappa:

```astro
import Stats from './blocks/Stats.astro';
...
const map = { ..., cta: Cta, stats: Stats, documents: Documents, ... } as const;
```

## Regole imparate sul campo

**YAML (`config.yml`)**
- Il rientro con **spazi** è la struttura. Mai usare Tab. Le voci di
  `types` hanno 10 spazi davanti a `- label:`.

**Limiti uguali nel pannello e nello schema**
- `min: 2` / `max: 4` in `config.yml` e `.min(2).max(4)` in Zod devono
  coincidere, altrimenti l'editor può salvare qualcosa che la build rifiuta.
- Il pulsante "Aggiungi" potrebbe **non fermarsi** al massimo, e il limite scattare solo
  al salvataggio, con un messaggio tipo "Numeri deve avere tra 2 e 4 elementi". Questo
  comportamento **non è stato verificato** con Sveltia: provarlo quando si aggiunge un
  blocco con limiti.

**Numeri come testo**
- `value` è `z.string()`, non un numero: serve per valori come `07` o `120 km`.
- Il pannello mette le virgolette da solo (Sveltia, da documentazione, quota sempre i
  testi che YAML leggerebbe come numeri o booleani). Scrivendo un `.md` **a mano** vanno
  messe: `value: "1947"`. Senza, YAML lo legge come numero e la build si ferma.

**Valori predefiniti**
- Un campo nuovo in un blocco esistente deve avere un valore predefinito
  (`.default('row')`), così le pagine già create continuano a funzionare.
- Il `default:` di `config.yml` vale per gli elementi nuovi. Con Sveltia, quando si apre
  e si salva un elemento **già esistente**, i campi che mancano nel file vengono scritti
  con il loro valore predefinito (osservato: `layout: grid`, `sort: entered`,
  `show_open: false`). Per un'impostazione in un file che esiste già (`src/data/*.json`)
  conviene comunque scrivere il valore anche nel file
  (es. `"page_header_style": "simple"` in `site.json`): il sito legge il file, non il pannello.
- Nei file si scrivono solo i campi compilati (`output.omit_empty_optional_fields`):
  un campo facoltativo lasciato vuoto non compare.

**Tailwind**
- Una classe scritta male **non dà errore**: viene ignorata. Va sempre
  controllato l'aspetto nel browser.
- Tailwind genera solo le classi che trova scritte per intero nei file. Per
  un valore calcolato (es. il numero di colonne) si passa una variabile CSS
  (`style={`--n:${items.length}`}`) e la classe la legge
  (`md:grid-cols-[repeat(var(--n),minmax(0,1fr))]`).
- I link hanno il colore principale per impostazione globale
  (`global.css`): su uno sfondo scuro vanno sovrascritti.

**Accessibilità**
- Elenchi di elementi simili: `<ul>`/`<li>`, non `<div>`.
- Immagini che dicono qualcosa: campo "testo alternativo".

## Come si prova

1. **Validare lo schema** con una pagina di prova in `src/content/pages/`
   (es. `zz-prova.md`) e il comando:
   ```bash
   npx astro sync
   ```
   Una pagina corretta passa; una sbagliata dà un errore che indica il campo
   (es. `sections.0.items.0.label: Required`).
2. **Provare i casi limite**: numero minimo e massimo di elementi, valore
   non valido, campo facoltativo omesso.
3. **Controllare l'aspetto**: `npm run dev`, apri la pagina di prova, prova
   larghezza desktop e mobile (anche con 2, 3 e 4 elementi).
4. **Build finale**: `npm run build`.
5. **Cancellare la pagina di prova.**

Se in sviluppo l'aspetto non corrisponde a quello della build, **riavvia
`npm run dev`**: può restare in cache una versione vecchia dei contenuti.

Per provare il **modulo** nel pannello, apri `/admin` in Chrome o Edge
(«Lavora con Repository Locale») e ricorda la regola del README: **ferma `npm run dev`
prima di salvare**, poi controlla con `git status` e `git diff`.

## Cosa succede se manca un file

Provato togliendo un file alla volta, con una pagina che usa il blocco:

| Manca | Effetto |
|---|---|
| 1 (`config.yml`) | L'editor non vede il blocco nel pannello (la build non se ne accorge: lo legge solo il pannello) |
| 2 (schema) | La build si ferma: `InvalidContentEntryDataError ... data does not match collection schema` |
| 3 (componente) | La build si ferma: `Could not resolve './blocks/Nome.astro'` |
| 4 (`Blocks.astro`) | La build si ferma: `Unable to render Component because it is undefined!` |

Quindi, dei 4 file, solo il primo può essere dimenticato senza accorgersene
(il blocco semplicemente non compare nel pannello).

## Lista di controllo

- [ ] `type` uguale nei file 1, 2 e 4 (`stats`)
- [ ] Campi, obbligatori e facoltativi, uguali nei file 1 e 2
- [ ] Limiti (`min`/`max`) uguali nel pannello e in Zod
- [ ] Valori predefiniti per i campi nuovi
- [ ] Provato con `npx astro sync` (caso corretto e casi sbagliati)
- [ ] Provato nel browser: desktop e mobile
- [ ] `npm run build` passa
- [ ] Pagina di prova cancellata
