/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}",
    "./node_modules/flowbite/**/*.js",
  ],
  theme: {
    extend: {},
    colors: {
      'primary': '#3C486B',
      'secondary': '#F0F0F0',
      'tertiary': '#F9D949',
      'accent': '#F45050',
    }
  },
  plugins: [require("flowbite/plugin")],
};
