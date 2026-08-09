import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { PercentileChart as PercentileChartFromBarrel } from "../../../index.js";
import type { PercentileBucket } from "./percentile-chart.js";
import { PercentileChart } from "./percentile-chart.js";

const slots = (container: HTMLElement, slot: string) =>
  container.querySelectorAll(`[data-slot="${slot}"]`);

const buckets: PercentileBucket[] = [
  { label: "10:00", p50: 40, p95: 120, p99: 240 },
  { label: "10:05", p50: 44, p95: 130, p99: 260 },
  { label: "10:10", p50: 38, p95: 110, p99: 210 },
  { label: "10:15", p50: 50, p95: 150, p99: 300 },
];

describe("PercentileChart", () => {
  it("renders two bands (p50–p95 and p95–p99)", () => {
    const { container } = render(<PercentileChart title="Latency" buckets={buckets} />);
    expect(slots(container, "percentile-band")).toHaveLength(2);
  });

  it("renders the p50 line", () => {
    const { container } = render(<PercentileChart title="Latency" buckets={buckets} />);
    expect(slots(container, "percentile-p50-line")).toHaveLength(1);
  });

  it("the p95–p99 band is lighter than the p50–p95 band (reading the spread)", () => {
    const { container } = render(<PercentileChart title="Latency" buckets={buckets} />);
    const bands = Array.from(slots(container, "percentile-band")) as SVGPathElement[];
    const inner = bands.find((b) => b.getAttribute("data-band") === "p50-p95");
    const outer = bands.find((b) => b.getAttribute("data-band") === "p95-p99");
    expect(inner).toBeDefined();
    expect(outer).toBeDefined();
    // the outer band (p95-p99) has lower opacity
    expect(Number(outer?.getAttribute("fill-opacity"))).toBeLessThan(
      Number(inner?.getAttribute("fill-opacity")),
    );
  });

  it("exposes role=img with the title in aria-label", () => {
    render(<PercentileChart title="Request latency" buckets={buckets} />);
    expect(screen.getByRole("img", { name: /request latency/i })).toBeInTheDocument();
  });

  it("empty buckets show an honest empty state", () => {
    const { container } = render(<PercentileChart title="Latency" buckets={[]} />);
    expect(slots(container, "percentile-empty")).toHaveLength(1);
    expect(slots(container, "percentile-band")).toHaveLength(0);
  });

  it("has an sr-only table with one row per bucket (a11y parity)", () => {
    const { container } = render(<PercentileChart title="Latency" buckets={buckets} />);
    const rows = container.querySelectorAll('[data-slot="percentile-table"] tbody tr');
    expect(rows).toHaveLength(4);
  });

  it("forwards ref to the root element", () => {
    const ref = createRef<HTMLElement>();
    render(<PercentileChart title="Latency" buckets={buckets} ref={ref} />);
    expect(ref.current?.getAttribute("data-slot")).toBe("percentile-chart");
  });

  it("is exported from the root barrel", () => {
    expect(PercentileChartFromBarrel).toBe(PercentileChart);
  });

  it("a missing percentile (NaN) becomes an honest gap — it never emits NaN into the SVG path", () => {
    // middle bucket with p95 missing: the band must break into contiguous sub-bands, never
    // writing "NaN" into the d attribute (which SVG rejects, truncating the render).
    const withGap: PercentileBucket[] = [
      { label: "t1", p50: 40, p95: 120, p99: 240 },
      { label: "t2", p50: 44, p95: Number.NaN, p99: 260 },
      { label: "t3", p50: 38, p95: 110, p99: 210 },
    ];
    const { container } = render(<PercentileChart title="Latency" buckets={withGap} />);
    const bands = Array.from(
      container.querySelectorAll('[data-slot="percentile-band"]'),
    ) as SVGPathElement[];
    for (const band of bands) {
      expect(band.getAttribute("d")).not.toMatch(/NaN/);
    }
    // the bands still render for the finite buckets (not everything disappears)
    const p50p95 = bands.find((b) => b.getAttribute("data-band") === "p50-p95");
    expect(p50p95?.getAttribute("d")).toBeTruthy();
    // the p50 line does not emit NaN either
    const line = container.querySelector('[data-slot="percentile-p50-line"]');
    expect(line?.getAttribute("d")).not.toMatch(/NaN/);
  });

  it("a missing percentile shows as — in the sr-only table (honest parity)", () => {
    const withGap: PercentileBucket[] = [{ label: "t1", p50: 40, p95: Number.NaN, p99: 240 }];
    const { container } = render(<PercentileChart title="Latency" buckets={withGap} />);
    const row = container.querySelector('[data-slot="percentile-table"] tbody tr');
    expect(row?.textContent).toContain("—");
    expect(row?.textContent).not.toContain("NaN");
  });

  it("has no axe violations", async () => {
    const { container } = render(<PercentileChart title="Latency" buckets={buckets} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("has no axe violations in the empty state", async () => {
    const { container } = render(<PercentileChart title="Latency" buckets={[]} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
