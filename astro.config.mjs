// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// Static output for GitHub Pages; the custom domain is served from public/CNAME.
export default defineConfig({
  site: 'https://a2app.ai',
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'file' },
  vite: { plugins: [tailwindcss()] },
});
