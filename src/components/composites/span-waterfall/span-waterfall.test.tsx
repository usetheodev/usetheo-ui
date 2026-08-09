import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { flattenVisible } from "../../../lib/trace/flatten.js";
import { expectNoA11yViolations } from "../../../test/a11y.js";
import { NESTED_TRACE } from "../../../test/fixtures/trace.js";
import { SpanWaterfall } from "./index.js";

const props = (over: Partial<React.ComponentProps<typeof SpanWaterfall>> = {}) => ({
  root: NESTED_TRACE,
  selectedId: "root" as string | null,
  onSelect: () => {},
  collapsed: new Set<string>(),
  ...over,
});

describe("SpanWaterfall", () => {
  it("test_renders_one_bar_for_each_visible_span", () => {
    const { container } = render(<SpanWaterfall {...props()} />);
    const bars = container.querySelectorAll('[data-slot="span-waterfall-row"]');
    expect(bars).toHaveLength(flattenVisible(NESTED_TRACE, new Set()).length);
  });

  it("test_the_bar_is_positioned_by_compute_bar_layout", () => {
    const { container } = render(<SpanWaterfall {...props()} />);
    const bar = container.querySelector('[data-slot="span-waterfall-bar"]') as HTMLElement;
    expect(bar.style.left).toMatch(/%$/);
    expect(bar.style.width).toContain("%");
  });

  it("test_a_span_with_an_error_uses_the_destructive_colour", () => {
    const { container } = render(<SpanWaterfall {...props()} />);
    const errBar = container.querySelector('[data-slot="span-waterfall-bar"][data-error="true"]');
    expect(errBar).toBeInTheDocument();
  });

  it("test_clicking_the_bar_selects_the_span", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<SpanWaterfall {...props({ onSelect })} />);
    await user.click(screen.getByRole("button", { name: /Timeline: llm\.plan/i }));
    expect(onSelect).toHaveBeenCalledWith("plan");
  });

  it("test_renders_the_time_axis_with_ticks", () => {
    const { container } = render(<SpanWaterfall {...props()} />);
    expect(container.querySelectorAll('[data-slot="span-waterfall-tick"]').length).toBeGreaterThan(
      0,
    );
  });

  it("test_an_in_flight_span_marks_the_bar_unbounded", () => {
    const inflight = {
      id: "root",
      parentId: null,
      name: "streaming",
      startTime: 0n,
      endTime: null,
    };
    const { container } = render(
      <SpanWaterfall {...props({ root: inflight, selectedId: "root" })} />,
    );
    expect(
      container.querySelector('[data-slot="span-waterfall-bar"][data-unbounded="true"]'),
    ).toBeInTheDocument();
  });

  it("test_a_zero_duration_window_does_not_throw", () => {
    const zero = { id: "root", parentId: null, name: "z", startTime: 5n, endTime: 5n };
    expect(() =>
      render(<SpanWaterfall {...props({ root: zero, selectedId: "root" })} />),
    ).not.toThrow();
  });

  it("has no a11y violations", async () => {
    await expectNoA11yViolations(<SpanWaterfall {...props()} />);
  });
});
