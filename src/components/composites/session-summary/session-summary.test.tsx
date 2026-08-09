import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { SessionTraceItem } from "../../../lib/session/types.js";
import { expectNoA11yViolations } from "../../../test/a11y.js";
import { SessionSummary } from "./index.js";

const NS = 1_000_000_000n;
const T0 = 1_750_000_000_000_000_000n;

const ITEMS: SessionTraceItem[] = [
  {
    id: "a",
    startTime: T0,
    endTime: T0 + 2n * NS,
    costUsd: 0.02,
    totalTokens: 100,
    model: "haiku",
    status: "OK",
  },
  {
    id: "b",
    startTime: T0 + NS,
    endTime: T0 + 5n * NS,
    costUsd: 0.04,
    totalTokens: 250,
    model: "gpt",
    status: "ERROR",
  },
  { id: "c", startTime: T0 + 2n * NS, endTime: T0 + 3n * NS, model: "haiku", status: "OK" },
];

describe("SessionSummary", () => {
  it("test_shows_the_trace_count_and_the_window", () => {
    render(<SessionSummary items={ITEMS} />);
    expect(screen.getByText("3")).toBeInTheDocument(); // traceCount
    expect(screen.getByTestId("session-duration")).toHaveTextContent("5s"); // window = 5000ms
  });

  it("test_an_error_count_above_zero_renders_destructive", () => {
    const { container } = render(<SessionSummary items={ITEMS} />);
    expect(
      container.querySelector('[data-slot="session-error"][data-error="true"]'),
    ).toBeInTheDocument();
  });

  it("test_a_zero_cost_is_honest_not_an_em_dash", () => {
    render(<SessionSummary items={[{ id: "a" }]} />);
    expect(screen.getByTestId("session-cost")).toHaveTextContent("$0.0000");
  });

  it("test_distinct_models_are_listed", () => {
    render(<SessionSummary items={ITEMS} />);
    expect(screen.getByTestId("session-models")).toHaveTextContent("gpt");
    expect(screen.getByTestId("session-models")).toHaveTextContent("haiku");
  });

  it("test_an_empty_list_shows_zeros_not_a_crash", () => {
    expect(() => render(<SessionSummary items={[]} />)).not.toThrow();
    expect(screen.getByTestId("session-cost")).toHaveTextContent("$0.0000");
  });

  it("has no a11y violations", async () => {
    await expectNoA11yViolations(<SessionSummary items={ITEMS} />);
  });
});
