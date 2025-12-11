import { defineConfig } from 'astro/config';
import netlify from "@astrojs/netlify";
import vue from "@astrojs/vue";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";

// https://astro.build/config
export default defineConfig({
  integrations: [vue(), react()],
  output: "server",
  adapter: netlify(),

  vite: {
    plugins: [tailwindcss()]
  }
});