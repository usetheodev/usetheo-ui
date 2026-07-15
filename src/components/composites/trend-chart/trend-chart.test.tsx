import { render } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { TrendChart as TrendChartFromBarrel } from "../../../index.js";
import type { TrendSeries } from "./trend-chart.js";
import { TrendChart, linScale, niceMax, seriesPath } from "./trend-chart.js";
import { RagLatency } from "./trend-chart.stories.js";

const pts = (...ys: (number | undefined)[]): TrendSeries["points"] =>
  ys.map((y, x) => ({ x, y: y as number }));

const series = (name: string, points: TrendSeries["points"], color = "#7c3aed"): TrendSeries => ({
  name,
  color,
  points,
});

function renderChart(s: TrendSeries[], props: Record<string, unknown> = {}) {
  return render(<TrendChart title="Latency" series={s} {...props} />);
}

const slots = (container: HTMLElement, slot: string) =>
  container.querySelectorAll(`[data-slot="${slot}"]`);

describe("TrendChart — pure helpers (ported)", () => {
  it("linScale maps the domain onto the range", () => {
    expect(linScale([0, 10], [0, 100])(5)).toBe(50);
  });

  it("linScale guards a zero-width domain (maps to r0, no NaN)", () => {
    const scale = linScale([5, 5], [0, 100]);
    expect(scale(5)).toBe(0);
    expect(Number.isNaN(scale(7))).toBe(false);
  });

  it("niceMax rounds up to a clean bound >= max", () => {
    expect(niceMax([0, 7, 34])).toBe(40);
    expect(niceMax([0.7])).toBe(0.7);
    expect(niceMax([])).toBe(0);
    expect(niceMax([-5])).toBe(0);
  });

  it("seriesPath builds an SVG polyline with one coord per point", () => {
    const id = (v: number) => v;
    const d = seriesPath(pts(1, 2, 3), id, id);
    expect(d.startsWith("M")).toBe(true);
    expect(d.split("L")).toHaveLength(3);
    expect(seriesPath([], id, id)).toBe("");
  });
});

describe("TrendChart — rendering (ported)", () => {
  it("renders one path per series", () => {
    const { container } = renderChart([
      series("p50", pts(1, 2, 3, 4, 5)),
      series("p95", pts(2, 4, 6, 8, 10), "#f59e0b"),
    ]);
    expect(slots(container, "trend-chart-line")).toHaveLength(2);
  });

  it("a11y table reads ragged series by shared period axis, not by position (M90)", () => {
    const a: TrendSeries = series("a", [
      { x: 0, y: 10 },
      { x: 2, y: 30 },
    ]);
    const b: TrendSeries = series("b", [
      { x: 0, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 3 },
    ]);
    const { container } = renderChart([a, b]);
    const rows = container.querySelectorAll('[data-slot="trend-chart-table"] tbody tr');
    expect(rows).toHaveLength(3);
    const middleCells = rows[1]?.querySelectorAll("td");
    expect(middleCells?.[1]?.textContent).toBe("—");
    expect(middleCells?.[2]?.textContent).toBe("2");
  });

  it("renders an explicit empty state when there is no data", () => {
    const { container } = renderChart([series("empty", [])]);
    expect(slots(container, "trend-chart-empty")).toHaveLength(1);
    expect(container.querySelector("svg")).toBeNull();
  });

  it("draws a visible dot for a single-bucket series", () => {
    const { container } = renderChart([series("one", [{ x: 0, y: 5 }])]);
    expect(slots(container, "trend-chart-dot")).toHaveLength(1);
  });

  it("marks each point on a sparse series (<5 points) (M76)", () => {
    const { container } = renderChart([series("sparse", pts(1, 2, 3, 4))]);
    expect(slots(container, "trend-chart-dot")).toHaveLength(4);
  });

  it("a dense series (>=5 points) draws the line only (M76)", () => {
    const { container } = renderChart([series("dense", pts(1, 2, 3, 4, 5))]);
    expect(slots(container, "trend-chart-dot")).toHaveLength(0);
  });

  it("a11y table mirrors series values through the formatter", () => {
    const { container } = renderChart([series("p50", pts(100, 200))], {
      valueFormatter: (v: number) => `${v}ms`,
    });
    const table = container.querySelector('[data-slot="trend-chart-table"]');
    expect(table?.textContent).toContain("100ms");
    expect(table?.textContent).toContain("200ms");
  });

  it("applies the formatter to the y-axis max label", () => {
    const { container } = renderChart([series("p50", pts(100, 900))], {
      valueFormatter: (v: number) => `${v}ms`,
    });
    const svg = container.querySelector("svg");
    expect(svg?.textContent).toContain("ms");
  });

  it("renders the title in the figcaption", () => {
    const { container } = renderChart([series("p50", pts(1, 2))]);
    expect(container.querySelector("figcaption")?.textContent).toBe("Latency");
  });

  it("a non-finite point does not break the path (EC-1 negative)", () => {
    const withNaN: TrendSeries = series("gappy", [
      { x: 0, y: 1 },
      { x: 1, y: Number.NaN },
      { x: 2, y: 3 },
    ]);
    const { container } = renderChart([withNaN]);
    const d = container.querySelector('[data-slot="trend-chart-line"]')?.getAttribute("d") ?? "";
    expect(d).not.toContain("NaN");
    const table = container.querySelector('[data-slot="trend-chart-table"]');
    expect(table?.textContent).toContain("—");
  });
});

describe("TrendChart — wiring & a11y", () => {
  it("all parts carry data-slot attributes", () => {
    const { container } = renderChart([series("p50", pts(1, 2, 3))]);
    for (const slot of [
      "trend-chart",
      "trend-chart-line",
      "trend-chart-legend",
      "trend-chart-table",
    ]) {
      expect(slots(container, slot).length).toBeGreaterThan(0);
    }
    const empty = renderChart([series("none", [])]);
    expect(slots(empty.container, "trend-chart-empty")).toHaveLength(1);
  });

  it("root forwards ref to the figure element", () => {
    const ref = createRef<HTMLElement>();
    render(<TrendChart ref={ref} title="T" series={[series("s", pts(1, 2))]} />);
    expect(ref.current?.tagName).toBe("FIGURE");
  });

  it("axe: no violations on chart and empty state", async () => {
    const { container } = render(
      <div>
        <TrendChart
          title="Multi"
          series={[series("a", pts(1, 2)), series("b", pts(2, 1), "#0ea5e9")]}
        />
        <TrendChart title="Empty" series={[series("none", [])]} />
      </div>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("TrendChart — story smoke", () => {
  it("rag latency story renders p50/p95 paths with the ms formatter", () => {
    const { container } = render(<RagLatency />);
    expect(slots(container, "trend-chart-line")).toHaveLength(2);
    expect(container.querySelector('[data-slot="trend-chart-table"]')?.textContent).toContain("ms");
  });
});

describe("TrendChart — barrel", () => {
  it("barrel exports the same symbol", () => {
    expect(TrendChartFromBarrel).toBe(TrendChart);
  });
});
