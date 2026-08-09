import tailwindcss from "@tailwindcss/vite";

export default {
  plugins: [
    tailwindcss(),
    {
      // Ladle injects vite-tsconfig-paths by default, which sweeps the reference repos under
      // .claude/knowledge-base/references (dozens of foreign tsconfig errors in the log).
      // Declaring the same name prevents the injection — precedent: theokit-ui/.ladle/vite.config.mjs.
      name: "vite:tsconfig-paths",
    },
  ],
};
