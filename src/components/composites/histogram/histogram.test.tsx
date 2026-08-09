import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Histogram as HistogramFromBarrel } from "../../../index.js";
import type { HistogramBin } from "../../../lib/chart/histogram.js";
import { Histogram } from "./histogram.js";

const slots = (container: HTMLElement, slot: string) =>
  container.querySelectorAll(`[data-slot="${slot}"]`);

const bins: HistogramBin[] = [
  { lo: 0, hi: 10, count: 2 },
  { lo: 10, hi: 20, count: 5 },
  { lo: 20, hi: 30, count: 1 },
];

describe("Histogram", () => {
  it("renders one bar per bin", () => {
    const { container } = render(<Histogram title="Durations" bins={bins} />);
    expect(slots(container, "histogram-bar")).toHaveLength(3);
  });

  it("the busiest bin's bar is the tallest", () => {
    const { container } = render(<Histogram title="Durations" bins={bins} />);
    const rects = Array.from(slots(container, "histogram-bar")) as SVGRectElement[];
    const heights = rects.map((r) => Number(r.getAttribute("height")));
    // bin[1] (count 5) is the peak
    expect(heights[1]).toBe(Math.max(...heights));
  });

  it("accepts values+binCount and produces the same number of bars as precomputed bins", () => {
    const { container } = render(
      <Histogram title="Durations" values={[0, 1, 2, 11, 12, 13, 14, 21]} binCount={3} />,
    );
    expect(slots(container, "histogram-bar")).toHaveLength(3);
  });

  it("exposes role=img with the title in aria-label", () => {
    render(<Histogram title="Latency distribution" bins={bins} />);
    expect(screen.getByRole("img", { name: /latency distribution/i })).toBeInTheDocument();
  });

  it("an empty distribution shows an honest empty state", () => {
    const { container } = render(<Histogram title="Durations" bins={[]} />);
    expect(slots(container, "histogram-empty")).toHaveLength(1);
    expect(slots(container, "histogram-bar")).toHaveLength(0);
  });

  it("an empty values array also shows the empty state", () => {
    const { container } = render(<Histogram title="Durations" values={[]} binCount={5} />);
    expect(slots(container, "histogram-empty")).toHaveLength(1);
  });

  it("has an sr-only table with one row per bin (a11y parity with the SVG)", () => {
    const { container } = render(<Histogram title="Durations" bins={bins} />);
    const rows = container.querySelectorAll('[data-slot="histogram-table"] tbody tr');
    expect(rows).toHaveLength(3);
  });

  it("forwards ref to the root element", () => {
    const ref = createRef<HTMLElement>();
    render(<Histogram title="Durations" bins={bins} ref={ref} />);
    expect(ref.current).not.toBeNull();
    expect(ref.current?.getAttribute("data-slot")).toBe("histogram");
  });

  it("is exported from the root barrel", () => {
    expect(HistogramFromBarrel).toBe(Histogram);
  });

  it("has no axe violations", async () => {
    const { container } = render(<Histogram title="Durations" bins={bins} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no axe violations in the empty state", async () => {
    const { container } = render(<Histogram title="Durations" bins={[]} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
