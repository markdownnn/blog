// @ts-check
import { defineConfig } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import expressiveCode from 'astro-expressive-code';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://mark-blog.vercel.app',

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [expressiveCode(), mdx(), sitemap()]
});
