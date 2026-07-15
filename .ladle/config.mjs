/** @type {import("@ladle/react").UserConfig} */
export default {
  stories: "src/**/*.stories.{ts,tsx}",
  // Ladle só lê vite.config da RAIZ por default; sem isto o plugin
  // @tailwindcss/vite nunca roda e as utilities não são geradas.
  viteConfig: ".ladle/vite.config.mjs",
  appendToHead:
    '<link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />',
  addons: {
    theme: { enabled: true, defaultState: "dark" },
    width: {
      enabled: true,
      options: { mobile: 375, tablet: 768, desktop: 1280, wide: 1536 },
      defaultState: 0,
    },
    a11y: { enabled: true },
    source: { enabled: true, defaultState: false },
  },
};
