import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { DatasetItemDiff as FromBarrel } from "../../../index.js";
import { DatasetItemDiff } from "./dataset-item-diff.js";
import type { DatasetItemSnapshot } from "./to-diff-text.js";

const OLD: DatasetItemSnapshot = {
  input: { q: "2+2" },
  expectedOutput: "4",
  metadata: { source: "seed" },
};
const NEW: DatasetItemSnapshot = {
  input: { q: "2+3" },
  expectedOutput: "5",
  metadata: { source: "review" },
};

const diffs = (c: HTMLElement) => c.querySelectorAll('[data-slot="diff-view"]');

describe("DatasetItemDiff", () => {
  it("renders three sections (input / output / metadata)", () => {
    const { container } = render(<DatasetItemDiff oldItem={OLD} newItem={NEW} />);
    expect(diffs(container)).toHaveLength(3);
  });

  it("omits the metadata section when absent from both items", () => {
    const a: DatasetItemSnapshot = { input: "a", expectedOutput: "x" };
    const b: DatasetItemSnapshot = { input: "b", expectedOutput: "y" };
    const { container } = render(<DatasetItemDiff oldItem={a} newItem={b} />);
    expect(diffs(container)).toHaveLength(2);
  });

  it("omits output AND metadata when only input is present", () => {
    const a: DatasetItemSnapshot = { input: "a" };
    const b: DatasetItemSnapshot = { input: "b" };
    const { container } = render(<DatasetItemDiff oldItem={a} newItem={b} />);
    expect(diffs(container)).toHaveLength(1);
  });

  it("is exported from the root barrel", () => {
    expect(FromBarrel).toBe(DatasetItemDiff);
  });

  it("has no axe violations", async () => {
    const { container } = render(<DatasetItemDiff oldItem={OLD} newItem={NEW} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
