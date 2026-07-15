import tailwindcss from "@tailwindcss/vite";

export default {
  plugins: [
    tailwindcss(),
    {
      // Ladle injeta vite-tsconfig-paths por default, que varre os repos de
      // referência sob .claude/knowledge-base/references (dezenas de erros de
      // tsconfig alheios no log). Declarar o mesmo nome impede a injeção —
      // precedente: theokit-ui/.ladle/vite.config.mjs.
      name: "vite:tsconfig-paths",
    },
  ],
};
