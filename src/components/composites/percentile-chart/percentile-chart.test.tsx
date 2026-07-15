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
  it("renderiza duas bandas (p50–p95 e p95–p99)", () => {
    const { container } = render(<PercentileChart title="Latency" buckets={buckets} />);
    expect(slots(container, "percentile-band")).toHaveLength(2);
  });

  it("renderiza a linha do p50", () => {
    const { container } = render(<PercentileChart title="Latency" buckets={buckets} />);
    expect(slots(container, "percentile-p50-line")).toHaveLength(1);
  });

  it("a banda p95–p99 é mais clara que a banda p50–p95 (leitura de spread)", () => {
    const { container } = render(<PercentileChart title="Latency" buckets={buckets} />);
    const bands = Array.from(slots(container, "percentile-band")) as SVGPathElement[];
    const inner = bands.find((b) => b.getAttribute("data-band") === "p50-p95");
    const outer = bands.find((b) => b.getAttribute("data-band") === "p95-p99");
    expect(inner).toBeDefined();
    expect(outer).toBeDefined();
    // a banda externa (p95-p99) tem menor opacidade
    expect(Number(outer?.getAttribute("fill-opacity"))).toBeLessThan(
      Number(inner?.getAttribute("fill-opacity")),
    );
  });

  it("expõe role=img com o título no aria-label", () => {
    render(<PercentileChart title="Request latency" buckets={buckets} />);
    expect(screen.getByRole("img", { name: /request latency/i })).toBeInTheDocument();
  });

  it("buckets vazios mostram empty state honesto", () => {
    const { container } = render(<PercentileChart title="Latency" buckets={[]} />);
    expect(slots(container, "percentile-empty")).toHaveLength(1);
    expect(slots(container, "percentile-band")).toHaveLength(0);
  });

  it("tem tabela sr-only com uma linha por bucket (paridade a11y)", () => {
    const { container } = render(<PercentileChart title="Latency" buckets={buckets} />);
    const rows = container.querySelectorAll('[data-slot="percentile-table"] tbody tr');
    expect(rows).toHaveLength(4);
  });

  it("encaminha ref para o elemento raiz", () => {
    const ref = createRef<HTMLElement>();
    render(<PercentileChart title="Latency" buckets={buckets} ref={ref} />);
    expect(ref.current?.getAttribute("data-slot")).toBe("percentile-chart");
  });

  it("é exportado pelo barrel raiz", () => {
    expect(PercentileChartFromBarrel).toBe(PercentileChart);
  });

  it("percentil ausente (NaN) vira gap honesto — nunca emite NaN no path SVG", () => {
    // bucket do meio com p95 ausente: a banda deve quebrar em sub-bandas contíguas,
    // nunca escrever "NaN" no atributo d (que o SVG rejeita, truncando o render).
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
    // as bandas ainda renderizam para os buckets finitos (não some tudo)
    const p50p95 = bands.find((b) => b.getAttribute("data-band") === "p50-p95");
    expect(p50p95?.getAttribute("d")).toBeTruthy();
    // a linha p50 também não emite NaN
    const line = container.querySelector('[data-slot="percentile-p50-line"]');
    expect(line?.getAttribute("d")).not.toMatch(/NaN/);
  });

  it("percentil ausente aparece como — na tabela sr-only (paridade honesta)", () => {
    const withGap: PercentileBucket[] = [{ label: "t1", p50: 40, p95: Number.NaN, p99: 240 }];
    const { container } = render(<PercentileChart title="Latency" buckets={withGap} />);
    const row = container.querySelector('[data-slot="percentile-table"] tbody tr');
    expect(row?.textContent).toContain("—");
    expect(row?.textContent).not.toContain("NaN");
  });

  it("não tem violações axe", async () => {
    const { container } = render(<PercentileChart title="Latency" buckets={buckets} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("não tem violações axe no empty state", async () => {
    const { container } = render(<PercentileChart title="Latency" buckets={[]} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
