/**
 * The README's catalog must match the filesystem.
 *
 * Regression: usetheokit/theokit-ui#73.
 *
 * The README claimed 54 components (39 primitives + 15 composites) while 87 shipped, and listed
 * none of them by name. The cost landed on a consumer, not on us: someone building on the Theo
 * stack hand-wrote a sidebar, a data table, form controls and empty states that were already in
 * this package, because nothing here told them what was inside.
 *
 * This test fails when the README drifts from `src/components/`, which is the only way a
 * generated block stays true after the first person forgets to run the script.
 */
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "vitest";

import { readCensus, renderCatalog, replaceCatalog } from "./sync-readme.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

describe("README catalog", () => {
  it("is in sync with src/components (run `pnpm sync:readme` if this fails)", async () => {
    const readme = await readFile(join(ROOT, "README.md"), "utf-8");
    const census = await readCensus();

    expect(readme).toBe(replaceCatalog(readme, renderCatalog(census)));
  });

  it("counts what is actually on disk", async () => {
    const census = await readCensus();

    // Guards against a vacuous pass if the directories move: an empty census would otherwise
    // "match" an empty catalog block.
    expect(census.primitives.length).toBeGreaterThan(20);
    expect(census.composites.length).toBeGreaterThan(20);
    expect(census.total).toBe(census.primitives.length + census.composites.length);
  });

  it("names the components a consumer is most likely to go looking for", async () => {
    const readme = await readFile(join(ROOT, "README.md"), "utf-8");

    // Not decoration: these are the ones that were rewritten by hand for lack of a signpost.
    for (const name of ["Sidebar", "DataTable", "Select", "EmptyState", "PageShell", "Badge"]) {
      expect(readme, `README should list ${name}`).toContain(`\`${name}\``);
    }
  });
});
