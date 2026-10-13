// Prepara Sveltia CMS (dal pacchetto npm) in public/admin/vendor/, servito dal nostro dominio.
// La pagina public/admin/index.html è statica: Astro non la ricarica durante lo sviluppo.
// esbuild serve perché il pacchetto importa le lingue come moduli JSON, che un file
// statico non può dare al browser così com'è.
import { build } from "esbuild";
import { cpSync, rmSync } from "node:fs";

const to = "public/admin/vendor";
const pkg = "node_modules/@sveltia/cms";

rmSync(to, { recursive: true, force: true });
await build({
  entryPoints: [`${pkg}/npm/index.js`],
  bundle: true,
  splitting: true,
  format: "esm",
  minify: true,
  outdir: `${to}/sveltia-cms`,
  chunkNames: "chunks/[name]-[hash]",
  logLevel: "warning",
});
// File che il pacchetto cerca accanto ai moduli (decodificatore immagini, caratteri).
cpSync(`${pkg}/npm/assets`, `${to}/sveltia-cms/assets`, { recursive: true });
console.log(`Sveltia CMS pronto in ${to}`);
