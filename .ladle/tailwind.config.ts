import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Config } from "tailwindcss";
import { theoUIPreset } from "../src/styles/tailwind-preset";

// Consumido via `@config` em styles.css (Tailwind v4 compat layer).
// content usa paths ABSOLUTOS: o v4 resolve globs relativos contra o CWD
// do processo (raiz do repo quando `ladle serve` roda), não contra este
// arquivo — "../src" apontaria para fora do repo e nenhuma utility sairia.
const here = dirname(fileURLToPath(import.meta.url));

export default {
  darkMode: "class",
  content: [join(here, "../src/**/*.{ts,tsx}"), join(here, "*.tsx")],
  presets: [theoUIPreset],
} satisfies Config;
