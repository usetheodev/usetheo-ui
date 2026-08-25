/**
 * sync-readme.ts — regenerate the component census and catalog in README.md from the filesystem.
 *
 * Why this exists: the README claimed "54 components (39 primitives + 15 composites)" while 87
 * shipped, and listed none of them. A consumer had no way to learn what this package contains
 * short of grepping `dist/index.d.ts` — and at least one did exactly that, after hand-writing a
 * sidebar, a data table and a set of form controls that were already here
 * (usetheokit/theokit-ui#73).
 *
 * A number a human has to remember to update is a number that goes stale. This derives both the
 * counts and the list from the directories, so the README is wrong only if the filesystem is.
 * `scripts/sync-readme.test.ts` fails when the file drifts from what this would write.
 */
import { readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

/** `action-bar` → `ActionBar`, matching the exported symbol. */
function toPascalCase(dir: string): string {
  return dir
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");
}

async function componentDirs(kind: "primitives" | "composites"): Promise<string[]> {
  const entries = await readdir(join(ROOT, "src/components", kind), { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));
}

export interface Census {
  primitives: string[];
  composites: string[];
  total: number;
}

export async function readCensus(): Promise<Census> {
  const primitives = await componentDirs("primitives");
  const composites = await componentDirs("composites");
  return { primitives, composites, total: primitives.length + composites.length };
}

/**
 * The catalog block, rendered between markers so hand-written prose around it survives.
 *
 * Grouped by the same mechanical rule the sibling package uses: a *primitive* imports no other
 * component from this package, a *composite* does. That is a structural distinction, not a
 * judgement about how useful something is.
 */
export function renderCatalog(census: Census): string {
  const asList = (dirs: string[]): string =>
    dirs.map((dir) => `\`${toPascalCase(dir)}\``).join(" · ");

  return [
    `**${String(census.total)} components** — ${String(census.primitives.length)} primitives + ${String(census.composites.length)} composites.`,
    "",
    `### Primitives (${String(census.primitives.length)})`,
    "",
    asList(census.primitives),
    "",
    `### Composites (${String(census.composites.length)})`,
    "",
    asList(census.composites),
  ].join("\n");
}

const BEGIN = "<!-- BEGIN:catalog -->";
const END = "<!-- END:catalog -->";

export function replaceCatalog(readme: string, body: string): string {
  const begin = readme.indexOf(BEGIN);
  const end = readme.indexOf(END);
  if (begin === -1 || end === -1) {
    throw new Error(`README.md is missing the ${BEGIN} … ${END} markers`);
  }
  return `${readme.slice(0, begin + BEGIN.length)}\n\n${body}\n\n${readme.slice(end)}`;
}

async function main(): Promise<void> {
  const census = await readCensus();
  const readmePath = join(ROOT, "README.md");
  const readme = await readFile(readmePath, "utf-8");

  await writeFile(readmePath, replaceCatalog(readme, renderCatalog(census)));

  process.stdout.write(
    `synced README.md: ${String(census.total)} components (${String(census.primitives.length)}P + ${String(census.composites.length)}C)\n`,
  );
}

// Only run when invoked directly — the test imports the helpers above.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err: unknown) => {
    console.error(err);
    process.exit(1);
  });
}
