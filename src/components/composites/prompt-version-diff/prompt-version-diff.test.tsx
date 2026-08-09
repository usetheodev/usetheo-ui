import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { PromptVersionDiff as FromBarrel } from "../../../index.js";
import { PromptVersionDiff } from "./prompt-version-diff.js";
import type { PromptSnapshot } from "./to-diff-text.js";

const OLD: PromptSnapshot = {
  template: "You are helpful.",
  config: { temperature: 0.5 },
};
const NEW: PromptSnapshot = {
  template: "You are very helpful.",
  config: { temperature: 0.9 },
};

const diffs = (c: HTMLElement) => c.querySelectorAll('[data-slot="diff-view"]');

describe("PromptVersionDiff", () => {
  it("renders two DiffViews (content + config)", () => {
    const { container } = render(<PromptVersionDiff oldPrompt={OLD} newPrompt={NEW} />);
    expect(diffs(container)).toHaveLength(2);
  });

  it("normalises a chat template into text (role: content)", () => {
    const oldChat: PromptSnapshot = { template: [{ role: "system", content: "Be concise." }] };
    const newChat: PromptSnapshot = { template: [{ role: "system", content: "Be very concise." }] };
    render(<PromptVersionDiff oldPrompt={oldChat} newPrompt={newChat} />);
    // the normalized "system:" prefix reaches the rendered diff cells
    expect(screen.getAllByText(/system:/).length).toBeGreaterThanOrEqual(1);
  });

  it("omits the config DiffView when both configs are absent", () => {
    const a: PromptSnapshot = { template: "a" };
    const b: PromptSnapshot = { template: "b" };
    const { container } = render(<PromptVersionDiff oldPrompt={a} newPrompt={b} />);
    expect(diffs(container)).toHaveLength(1);
  });

  it("is exported from the root barrel", () => {
    expect(FromBarrel).toBe(PromptVersionDiff);
  });

  it("has no axe violations", async () => {
    const { container } = render(<PromptVersionDiff oldPrompt={OLD} newPrompt={NEW} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
