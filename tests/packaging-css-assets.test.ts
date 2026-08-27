import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * usetheodev/usetheo-ui#10 — the public CSS assets are in the tarball.
 *
 * The seed brought `tailwind-preset.ts` across without the CSS pipeline around it, so from 0.14.0
 * the package published ZERO `.css` files while consumers kept importing `@usetheo/ui/preset.css`,
 * `/components.css` and `/fonts-cdn.css`. A clean `vite build` against those versions fails to
 * resolve them; the deployed dashboard only worked because it had been built in the 0.13.x era.
 *
 * That gap survived every gate for a reason worth stating: the suite runs under jsdom, which does
 * not resolve CSS imports, so no test could see it. This one therefore asserts on `npm pack`
 * output — the actual published artifact — rather than on anything the module graph can reach.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** Every CSS path the package promises, as `exports` key -> file inside the tarball. */
const PROMISED_CSS = [
  "styles.css",
  "styles-v3-legacy.css",
  "components.css",
  "tokens.css",
  "tokens-v4.css",
  "preset.css",
  "fonts.css",
  "fonts-cdn.css",
] as const;

/** The files `npm pack` would publish, as tarball-relative paths (`dist/…`). */
function packedFiles(): string[] {
  const raw = execFileSync("npm", ["pack", "--dry-run", "--json"], {
    cwd: ROOT,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });
  const parsed = JSON.parse(raw) as Array<{ files: Array<{ path: string }> }>;
  return (parsed[0]?.files ?? []).map((f) => f.path);
}

describe("#10 — the published tarball carries the CSS assets", () => {
  const files = packedFiles();

  it.each(PROMISED_CSS)("test_%s_is_published", (name) => {
    // The assertion is on the PACK output, not on `dist/` on disk: a file that exists locally but
    // is excluded by `files` is exactly the shape this regression had.
    expect(files).toContain(`dist/${name}`);
  });

  it("test_the_self_hosted_font_assets_ship_too", () => {
    // `fonts.css` refers to `./fonts/geist-400.woff2`. Publishing the stylesheet without the woff2
    // is worse than publishing neither: the import resolves and every glyph 404s.
    const woff2 = files.filter((f) => f.startsWith("dist/fonts/") && f.endsWith(".woff2"));
    expect(woff2.length).toBeGreaterThanOrEqual(6);
  });

  it("test_every_css_export_points_at_a_file_that_is_published", () => {
    // The other half of the contract. A path in `exports` that no packed file backs is a promise
    // the registry cannot keep, and it fails at the consumer's bundler rather than here.
    const pkg = JSON.parse(readFileSync(join(ROOT, "package.json"), "utf8")) as {
      exports: Record<string, unknown>;
    };
    const cssTargets = Object.entries(pkg.exports)
      .filter(([key]) => key.endsWith(".css"))
      .map(([, target]) => String(target).replace(/^\.\//, ""));
    expect(cssTargets.length).toBe(PROMISED_CSS.length);
    for (const target of cssTargets) {
      expect(files).toContain(target);
    }
  });

  it("test_styles_css_imports_the_precompiled_utilities", () => {
    // `components.css` is the file the whole pre-compilation exists for. If `styles.css` stopped
    // importing it, the single documented entrypoint would silently ship without any utility rule
    // and components would render flat — the failure this pipeline was built to prevent.
    const stylesPath = join(ROOT, "dist", "styles.css");
    expect(existsSync(stylesPath)).toBe(true);
    expect(readFileSync(stylesPath, "utf8")).toContain("components.css");
  });

  it("test_components_css_carries_the_state_variants_not_just_base_utilities", () => {
    // Anti-vacuity for the compile step. A `components.css` holding only static utilities would
    // pass every assertion above while dropping hover, focus and data-state — which is precisely
    // what happens when Tailwind's `@source` scan finds nothing.
    const css = readFileSync(join(ROOT, "dist", "components.css"), "utf8");
    for (const variant of [".hover\\:", ".focus-visible\\:", "data-\\[state"]) {
      expect(css).toContain(variant);
    }
  });
});
