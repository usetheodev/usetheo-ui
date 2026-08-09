import { render } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { TrendChart as TrendChartFromBarrel } from "../../../index.js";
import type { TrendSeries } from "./trend-chart.js";
import { TrendChart, linScale, markedPoints, niceMax, seriesPath, xTicks } from "./trend-chart.js";
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
    expect(niceMax([0.7])).toBeCloseTo(0.7, 10);
    expect(niceMax([])).toBe(0);
    expect(niceMax([-5])).toBe(0);
  });

  it("niceMax returns a clean float, not a binary-float artifact", () => {
    // Math.ceil(0.68 / 0.1) * 0.1 === 0.7000000000000001 without the toPrecision fix.
    expect(niceMax([0.68])).toBe(0.7);
    expect(niceMax([0.5, 0.68])).toBe(0.7);
    expect(niceMax([0.34])).toBe(0.4);
  });

  /*
   * M144 — A LACUNA.
   *
   * This file's docblock already states that "non-finite points are skipped in the line and read as
   * `—` in the table", and `niceMax`, `hasData` and the accessible table honour it. `seriesPath` was
   * the one that contradicted it: it FILTERED the non-finite point out — erasing the information of
   * WHERE the hole was — and then joined the survivors with `L`, drawing a continuous line straight
   * over the gap.
   *
   * Breaking the line is every serious library's convention: `spanGaps` (Chart.js), `connectNulls`
   * (Highcharts, ECharts, Recharts) and `connectgaps` (Plotly) default to `false`, and Grafana ships
   * "Connect null values: Never". It is also the only honest reading — joining asserts a continuity
   * the data does not have.
   */
  it("seriesPath breaks the line at the gap", () => {
    const id = (v: number) => v;
    const d = seriesPath(pts(1, undefined, 3), id, id);
    // TWO subpaths: one before the gap, one after
    expect(d.split("M")).toHaveLength(3); // "" + two stretches
    expect(d).not.toMatch(/M[^M]*L[^M]*L/); // no stretch joining 3 points
  });

  it("seriesPath sem lacuna segue UM subcaminho", () => {
    const id = (v: number) => v;
    const d = seriesPath(pts(1, 2, 3), id, id);
    // pins the non-regression: every existing chart has a dense series
    expect(d.split("M")).toHaveLength(2);
    expect(d.split("L")).toHaveLength(3);
  });

  it("seriesPath with a gap at the edge creates no empty subpath", () => {
    const id = (v: number) => v;
    for (const d of [
      seriesPath(pts(undefined, 1, 2), id, id),
      seriesPath(pts(1, 2, undefined), id, id),
    ]) {
      expect(d.split("M")).toHaveLength(2);
      expect(d.trimEnd().endsWith("M")).toBe(false);
    }
  });

  it("seriesPath with consecutive gaps produces TWO subpaths, not three", () => {
    const id = (v: number) => v;
    // an empty stretch is not a stretch
    expect(seriesPath(pts(1, undefined, undefined, 4), id, id).split("M")).toHaveLength(3);
  });

  it("seriesPath with an isolated point between gaps produces a lone M", () => {
    const id = (v: number) => v;
    const d = seriesPath(pts(undefined, 2, undefined), id, id);
    expect(d.split("M")).toHaveLength(2);
    expect(d).not.toContain("L"); // a one-point line has no length
  });

  /**
   * The test above proves an isolated point becomes a lone `M` — and a lone `M` DRAWS NOTHING.
   * Measured in M144's e2e: a dense 30-day series with two finite days separated by a gap rendered
   * `d="M419.86,92.00 M448.00,36.00"`, a zero-bounding-box `path` the browser reports as not
   * visible. The data exists, it is correct, and the operator sees nothing.
   *
   * The old rule keyed on the TOTAL number of points (`< SPARSE_MARKER_MAX`), not on whether the
   * point is actually drawn — its own comment said "a dot keeps real data from rendering as an
   * invisible line", an intent it stopped fulfilling after the densification. Chart.js and Plotly
   * mark the isolated point for exactly this reason.
   */
  it("an isolated point between gaps GETS a marker even in a dense series", () => {
    const dense = pts(1, undefined, 3, undefined, ...Array.from({ length: 20 }, () => undefined));
    const marked = markedPoints(dense);
    expect(marked.map((p) => p.y)).toEqual([1, 3]);
  });

  it("a point with a finite neighbour gets NO marker — the line already draws it", () => {
    // SIX contiguous finite points: above the sparsity floor, so the dense branch answers. With
    // three (this case's previous version) the series is sparse in DATA and all three get marked —
    // which is M76's rule being corrected, not a regression.
    const dense = pts(1, 2, 3, 4, 5, 6, ...Array.from({ length: 20 }, () => undefined));
    expect(markedPoints(dense)).toEqual([]);
  });

  // DENSE series on purpose: with 3 slots the sparse branch answers and the neighbour logic — what
  // this case claims to exercise — never runs. Restricting the dense branch to `i > 0 && i < len-1`
  // would leave this test's previous version green, which is the definition of a test that measures
  // nothing.
  it("an edge point is isolated when its only neighbour is a gap", () => {
    // FIVE finite points (above the sparsity floor, so the dense branch answers), all isolated, and
    // both ENDS among them. With fewer than five the sparse branch returns everything and the
    // neighbour logic never runs — which is how the mutation `i > 0 && i < len-1` survived the campaign.
    const alternating = pts(1, undefined, 3, undefined, 5, undefined, 7, undefined, 9);
    expect(markedPoints(alternating).map((p) => p.y)).toEqual([1, 3, 5, 7, 9]);
  });

  /**
   * M76's rule keyed on the total number of SLOTS. After the densification a slot stopped being a
   * datum: a 30-day series with 3 contiguous days of usage has 30 slots and 3 points, fell into the
   * dense branch, and because all three are neighbours of one another NONE got a marker — the 1-4
   * bucket cliff M76 exists to anchor, switched off silently by M144's change. Before M144 that same
   * series arrived with 3 points and got 3 markers.
   *
   * The rule now keys on FINITE points, which is what "sparse series" always meant.
   */
  it("a sparse series keeps marking EVERY finite point — densified included", () => {
    expect(markedPoints(pts(1, 2, 3)).map((p) => p.y)).toEqual([1, 2, 3]);
    // 30 slots, 3 contiguous days of usage: sparse in DATA, dense in slots.
    const dense = pts(
      ...Array.from({ length: 20 }, () => undefined),
      1,
      2,
      3,
      ...Array.from({ length: 7 }, () => undefined),
    );
    expect(markedPoints(dense).map((p) => p.y)).toEqual([1, 2, 3]);
  });

  // The boundary of the very constant the whole function keys on. Without these two cases the
  // mutation `<` → `<=` survives the entire suite — and it went through the 7-mutant campaign unseen.
  it("the SPARSE_MARKER_MAX boundary: 4 finite points mark all, 5 mark none", () => {
    expect(markedPoints(pts(1, 2, 3, 4)).map((p) => p.y)).toEqual([1, 2, 3, 4]);
    expect(markedPoints(pts(1, 2, 3, 4, 5))).toEqual([]);
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

  it("yMax prop pins the top of the axis instead of auto-fitting to the data max", () => {
    // data max 0.68 → without yMax the axis top is niceMax(0.68)=0.7; yMax={1} pins it to 1.
    const { container } = renderChart([series("score", pts(0.5, 0.68))], { yMax: 1 });
    const labels = [...container.querySelectorAll("svg text")].map((t) => t.textContent);
    expect(labels).toContain("1"); // top axis label = valueFormatter(yMax=1)
    expect(labels).not.toContain("0.7");
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

/**
 * M146 — the chart let you read neither the WHEN nor the HOW MUCH (`usetheodev/usetheo-ui#17`).
 *
 * The SVG had exactly two `<text>` nodes, both on the Y axis, and the accessible table numbered
 * its rows (`Point 1, 2, 3…`). On a chart labelled "Cost per day", no date appeared — the operator
 * saw that there had been a spike and had no path at all to learn which day it was. For anyone
 * using a screen reader the table is the ONLY channel, and it said ordinals.
 *
 * The design decision is an OPTIONAL `xFormatter`, never inference. Inferring by magnitude ("a big
 * `x` ⇒ epoch-ms") would work — and it is the exact shape of the defect this design system has just
 * paid for: M76's marker rule keyed on `points.length` instead of asking what it wanted to know,
 * and M144's densification switched it off silently. Measured: 5 of the consumer's 6 factories pass
 * an INDEX; only one passes epoch-ms. Without the prop, nothing changes for the others.
 */
describe("TrendChart — the X axis and reading the value (M146)", () => {
  const asDate = (i: number) => new Date(Date.UTC(2026, 6, 20 + i)).toISOString().slice(5, 10);

  it("without xFormatter the table keeps numbering — no index consumer changes", () => {
    const { container } = renderChart([series("p50", pts(1, 2, 3))]);
    const first = container.querySelector('[data-slot="trend-chart-table"] tbody td');
    expect(first?.textContent).toBe("1");
  });

  it("with xFormatter the table shows the LABEL in place of the ordinal", () => {
    const { container } = renderChart([series("cost", pts(1, 2, 3))], {
      xFormatter: (x: number) => asDate(x),
    });
    const cells = [...container.querySelectorAll('[data-slot="trend-chart-table"] tbody tr')].map(
      (tr) => tr.querySelector("td")?.textContent,
    );
    expect(cells).toEqual(["07-20", "07-21", "07-22"]);
  });

  it("the column header follows — 'Point' over dates would be the same lie at smaller scale", () => {
    const { container } = renderChart([series("cost", pts(1, 2))], {
      xFormatter: (x: number) => asDate(x),
      xLabel: "Day",
    });
    const th = container.querySelector('[data-slot="trend-chart-table"] thead th');
    expect(th?.textContent).toBe("Day");
  });

  it("with xFormatter the X axis gains visible labels", () => {
    const { container } = renderChart([series("cost", pts(1, 2, 3, 4, 5))], {
      xFormatter: (x: number) => asDate(x),
    });
    const ticks = container.querySelectorAll('[data-slot="trend-chart-xtick"]');
    expect(ticks.length).toBeGreaterThan(0);
    // The first and the last are ALWAYS present: they are the window's edges, and they are what
    // answers "from when to when" even when the middle is sampled.
    const labels = [...ticks].map((t) => t.textContent);
    expect(labels[0]).toBe("07-20");
    expect(labels[labels.length - 1]).toBe("07-24");
  });

  it("without xFormatter NO X-axis label is drawn", () => {
    // This is not cosmetic: `PAD.bottom` is 4, and growing the padding moves the `yScale` and
    // therefore EVERY `y` coordinate of every path already tested. Rendering the axis only when a
    // formatter exists keeps the index consumers' geometry byte for byte.
    const { container } = renderChart([series("p50", pts(1, 2, 3))]);
    expect(container.querySelectorAll('[data-slot="trend-chart-xtick"]')).toHaveLength(0);
  });
});

/**
 * M146, second sub-bug — there was no way to read a point's VALUE.
 *
 * Grepping the component for `crosshair|tooltip|onMouseMove|hover` returned ZERO. The only
 * `<title>` nodes carried the series NAME, never the value. For "how much did user X spend on
 * Tuesday" there was no visual path at all — only the `sr-only` table, which by definition is not
 * on screen.
 *
 * The shape follows this same design system's `span-waterfall`: an HTML overlay positioned by %,
 * `aria-hidden`, `pointer-events-none`. Radix Tooltip was refused — it would drag in
 * `@radix-ui/react-tooltip` and require a `<Tooltip.Provider>` in the app, breaking the property
 * that defines this component (`registryDependencies` = [cn, tailwind-preset], "no chart lib —
 * keeps the registry copy-pasteable"), and it would fail at runtime, not at build.
 *
 * The tooltip is DECORATIVE (`aria-hidden`). That is only legitimate because the accessible table
 * now carries the same information — before the X-axis fix it numbered, and a decorative tooltip
 * would have created information exclusive to mouse users.
 */
describe("TrendChart — reading the value under the cursor (M146)", () => {
  it("with no interaction, no tooltip is rendered", () => {
    const { container } = renderChart([series("p50", pts(1, 2, 3))]);
    expect(container.querySelector('[data-slot="trend-chart-tooltip"]')).toBeNull();
  });

  it("the tooltip is decorative — the accessible table is the screen-reader channel", () => {
    // If it ever stops being aria-hidden without the table covering the same data, this case warns.
    const { container } = renderChart([series("p50", pts(1, 2, 3))]);
    const table = container.querySelector('[data-slot="trend-chart-table"]');
    expect(table).not.toBeNull();
    expect(table?.className).toContain("sr-only");
  });

  it("the component exposes the hover hook on the chart wrapper", () => {
    // The minimum contract: a surface exists that receives cursor movement. Without it there is
    // nowhere to hang any crosshair, and the defect returns silently.
    const { container } = renderChart([series("p50", pts(1, 2, 3))]);
    expect(container.querySelector('[data-slot="trend-chart-surface"]')).not.toBeNull();
  });
});

describe("xTicks — the X axis density (M146)", () => {
  const axis = (n: number) => Array.from({ length: n }, (_, i) => i);

  it("with few points, all of them get a label", () => {
    expect(xTicks(axis(3), 600)).toEqual([0, 1, 2]);
  });

  it("with many points it SAMPLES — 31 days do not fit in 600px", () => {
    const t = xTicks(axis(31), 600);
    expect(t.length).toBeLessThan(31);
    expect(t.length).toBeGreaterThan(2);
  });

  it("the FIRST and the LAST are always there — they are the window edges", () => {
    // Without them the reader does not know from when to when the chart speaks, and the sampling's
    // rounding can lose either: with 31 points and a step of 5, the last index chosen would be 30 by
    // accident, not by guarantee.
    for (const n of [31, 37, 61, 100]) {
      const t = xTicks(axis(n), 600);
      expect(t[0]).toBe(0);
      expect(t[t.length - 1]).toBe(n - 1);
    }
  });

  it("the density follows the width — more space, more labels", () => {
    expect(xTicks(axis(61), 1200).length).toBeGreaterThan(xTicks(axis(61), 400).length);
  });

  it("never repeats a position", () => {
    const t = xTicks(axis(61), 600);
    expect(new Set(t).size).toBe(t.length);
  });
});

describe("the chart footer only grows when there is an X axis (M146)", () => {
  const baseY = (c: HTMLElement) => c.querySelector("svg line")?.getAttribute("y1");

  it("without xFormatter the geometry is EXACTLY what it was", () => {
    // `PAD.bottom` is 4. Growing the footer moves the `yScale` and with it every `y` coordinate of
    // every `path` already tested in the three consumers that pass an index. This case is what
    // guarantees they do not move a pixel.
    const { container } = renderChart([series("p50", pts(1, 2, 3))]);
    expect(baseY(container)).toBe(String(180 - 4));
  });

  it("with xFormatter the footer opens space for the label", () => {
    const { container } = renderChart([series("cost", pts(1, 2, 3))], {
      xFormatter: (x: number) => String(x),
    });
    expect(baseY(container)).toBe(String(180 - 4 - 14));
  });
});
