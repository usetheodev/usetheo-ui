#!/usr/bin/env tsx
/**
 * Emits the package's public CSS assets into `dist/` (issue #10).
 *
 * The seed that created this repository brought `src/styles/tailwind-preset.ts` across but not the
 * CSS pipeline around it, so from 0.14.0 onwards the tarball shipped ZERO `.css` files while the
 * documented entrypoints (`@usetheo/ui/preset.css`, `/components.css`, `/styles.css`, …) stayed in
 * the consumer's imports. A clean `vite build` against those versions fails to resolve them; the
 * deployed dashboard only worked because it had been built back in the 0.13.x era.
 *
 * Two kinds of output, and the distinction is the whole design:
 *
 * - **Static files** (`tokens`, `tokens-v4`, `preset`, `styles`, `styles-v3-legacy`, `fonts`,
 *   `fonts-cdn`, and the woff2 assets) are copied verbatim. They are authored CSS, not build
 *   products, and `src/styles/` is their source of truth.
 *
 * - **`components.css` is COMPILED** by the Tailwind v4 CLI against `components-entry.css`, which
 *   `@source`-scans this repo's own `src/`. It has to be built rather than copied because it
 *   materializes the utility rules for the classes the components reference TODAY — a copy from an
 *   old tarball would be missing every class added since.
 *
 * Why the library pre-compiles instead of letting the consumer's Tailwind do it: `@source` globs do
 * not follow symlinks, and under pnpm `node_modules/@usetheo/ui` is one. The consumer-side pattern
 * expands to zero files and every hover/focus/data-state variant goes unemitted.
 */

import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { copyFile, mkdir, readdir } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SRC = join(ROOT, "src", "styles");
const DIST = join(ROOT, "dist");

/** The verbatim assets, as `source basename` -> `dist basename`. */
const STATIC_CSS: ReadonlyArray<readonly [string, string]> = [
  ["tokens.css", "tokens.css"],
  ["tokens-v4.css", "tokens-v4.css"],
  ["preset.css", "preset.css"],
  ["styles.css", "styles.css"],
  ["styles-v3-legacy.css", "styles-v3-legacy.css"],
  ["fonts.css", "fonts.css"],
  ["fonts-cdn.css", "fonts-cdn.css"],
];

/**
 * The Tailwind v4 CLI binary.
 *
 * Resolved through the package's own declared `bin` entry rather than a `.bin/tailwindcss` shim.
 * Two reasons, both learned the hard way upstream: the root shim can be the LEGACY v3 CLI that
 * `tailwindcss-animate` drags in, and a nested `node_modules/.bin` shim only exists under some
 * pnpm hoist layouts — absent under a `--frozen-lockfile` CI install, which is exactly where a
 * build must not break.
 */
function resolveTailwindCli(): string {
  const req = createRequire(import.meta.url);
  const pkgPath = req.resolve("@tailwindcss/cli/package.json");
  const pkg = req("@tailwindcss/cli/package.json") as { bin?: string | Record<string, string> };
  const binField = typeof pkg.bin === "string" ? pkg.bin : pkg.bin?.tailwindcss;
  if (binField === undefined) {
    throw new Error("[build-css] @tailwindcss/cli declares no `tailwindcss` bin entry");
  }
  const binPath = resolve(dirname(pkgPath), binField);
  if (!existsSync(binPath)) {
    throw new Error(`[build-css] @tailwindcss/cli bin does not exist at ${binPath}`);
  }
  return binPath;
}

async function main(): Promise<void> {
  await mkdir(DIST, { recursive: true });

  for (const [from, to] of STATIC_CSS) {
    const source = join(SRC, from);
    if (!existsSync(source)) {
      // Loud, not skipped: a missing source here is how the assets went missing in the first place,
      // and a build that quietly ships six of seven files is the same defect one file smaller.
      throw new Error(`[build-css] missing source asset: ${source}`);
    }
    await copyFile(source, join(DIST, to));
  }

  // The woff2 files live at `dist/fonts/` because `fonts.css` refers to them as `./fonts/…` — the
  // relative URL has to resolve inside the consumer's `node_modules/@usetheo/ui/dist/` tree.
  const fontsSrc = join(SRC, "fonts");
  if (existsSync(fontsSrc)) {
    const fontsDist = join(DIST, "fonts");
    await mkdir(fontsDist, { recursive: true });
    for (const entry of await readdir(fontsSrc)) {
      await copyFile(join(fontsSrc, entry), join(fontsDist, entry));
    }
  }

  const result = spawnSync(
    process.execPath,
    [
      resolveTailwindCli(),
      "--input",
      join(SRC, "components-entry.css"),
      "--output",
      join(DIST, "components.css"),
      "--minify",
    ],
    { stdio: "inherit", cwd: ROOT },
  );
  if (result.status !== 0) {
    throw new Error(`[build-css] tailwind CLI exited with ${String(result.status)}`);
  }

  console.log(`[build-css] emitted ${String(STATIC_CSS.length)} static assets + components.css`);
}

await main();
