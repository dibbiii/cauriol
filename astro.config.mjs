import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import site from './src/data/site.json' with { type: 'json' };

// L'URL del sito arriva dalle impostazioni modificabili dal CMS,
// così per un nuovo cliente non serve toccare questo file.
export default defineConfig({
  site: site.url,
  trailingSlash: 'ignore',
  devToolbar: { enabled: false },
  integrations: [sitemap({ filter: (page) => !page.includes('/admin') })],
  vite: {
    plugins: [tailwindcss()],
    // Il pannello /admin (Sveltia) è un file da circa 2,3 MB: è normale per un editor completo
    // e lo scaricano solo gli editor, non i visitatori. Alziamo il limite dell'avviso.
    build: { chunkSizeWarningLimit: 3000 },
  },
});
