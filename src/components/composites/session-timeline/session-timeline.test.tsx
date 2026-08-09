import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { SessionTraceItem } from "../../../lib/session/types.js";
import { expectNoA11yViolations } from "../../../test/a11y.js";
import { SessionTimeline } from "./index.js";

const NS = 1_000_000_000n;
const T0 = 1_750_000_000_000_000_000n;

// Deliberately out of order to prove the timeline sorts by startTime.
const ITEMS: SessionTraceItem[] = [
  {
    id: "trace-2",
    name: "segundo",
    startTime: T0 + 3n * NS,
    endTime: T0 + 5n * NS,
    costUsd: 0.02,
    status: "OK",
  },
  {
    id: "trace-1",
    name: "first",
    startTime: T0,
    endTime: T0 + 2n * NS,
    costUsd: 0.01,
    status: "OK",
  },
  {
    id: "trace-3",
    name: "third",
    startTime: T0 + 6n * NS,
    endTime: T0 + 7n * NS,
    status: "ERROR",
  },
];

const props = (over: Partial<React.ComponentProps<typeof SessionTimeline>> = {}) => ({
  items: ITEMS,
  selectedId: null as string | null,
  onSelect: () => {},
  ...over,
});

const makeItems = (n: number): SessionTraceItem[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `t${i}`,
    name: `trace ${i}`,
    startTime: T0 + BigInt(i) * NS,
    endTime: T0 + BigInt(i + 1) * NS,
  }));

describe("SessionTimeline", () => {
  it("test_renders_one_row_per_trace", () => {
    render(<SessionTimeline {...props()} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(3);
  });

  it("test_sorts_by_start_time", () => {
    render(<SessionTimeline {...props()} />);
    const rows = screen.getAllByRole("listitem");
    expect(rows.map((r) => within(r).getByTestId("session-trace-name").textContent)).toEqual([
      "first",
      "segundo",
      "third",
    ]);
  });

  it("test_the_bar_is_positioned_by_compute_bar_layout", () => {
    const { container } = render(<SessionTimeline {...props()} />);
    const bar = container.querySelector('[data-slot="session-timeline-bar"]') as HTMLElement;
    expect(bar.style.left).toMatch(/%$/);
    expect(bar.style.width).toContain("%");
  });

  it("test_clicking_the_row_fires_onSelect", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<SessionTimeline {...props({ onSelect })} />);
    await user.click(screen.getByText("segundo"));
    expect(onSelect).toHaveBeenCalledWith("trace-2");
  });

  it("test_a_trace_with_an_error_sets_data_error", () => {
    const { container } = render(<SessionTimeline {...props()} />);
    expect(
      container.querySelector('[data-slot="session-timeline-bar"][data-error="true"]'),
    ).toBeInTheDocument();
  });

  it("test_above_the_threshold_it_virtualises", () => {
    const { container } = render(
      <SessionTimeline {...props({ items: makeItems(250), virtualizeThreshold: 200 })} />,
    );
    expect(container.querySelector('[data-slot="session-timeline-virtual"]')).toBeInTheDocument();
  });

  it("test_an_empty_list_shows_the_empty_state", () => {
    render(<SessionTimeline {...props({ items: [] })} />);
    expect(screen.getByRole("heading", { name: /no traces/i })).toBeInTheDocument();
  });

  it("has no a11y violations", async () => {
    await expectNoA11yViolations(<SessionTimeline {...props()} />);
  });
});
