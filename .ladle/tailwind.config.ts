import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { Config } from "tailwindcss";
import { theoUIPreset } from "../src/styles/tailwind-preset";

// Consumed through `@config` in styles.css (the Tailwind v4 compat layer).
// content uses ABSOLUTE paths: v4 resolves relative globs against the process CWD (the repo
// root when `ladle serve` runs), not against this file — "../src" would point outside the
// repo and no utility would be emitted.
const here = dirname(fileURLToPath(import.meta.url));

export default {
  darkMode: "class",
  content: [join(here, "../src/**/*.{ts,tsx}"), join(here, "*.tsx")],
  presets: [theoUIPreset],
} satisfies Config;
