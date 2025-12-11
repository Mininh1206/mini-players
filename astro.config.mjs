import { defineConfig } from 'astro/config';
import netlify from "@astrojs/netlify";
import vue from "@astrojs/vue";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  site: "https://mini-players.netlify.app",
  integrations: [vue(), react(), sitemap()],
  output: "server",
  adapter: netlify(),

  vite: {
    plugins: [tailwindcss()]
  }
});