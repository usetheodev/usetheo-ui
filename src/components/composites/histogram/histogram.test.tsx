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
  it("renderiza uma barra por bin", () => {
    const { container } = render(<Histogram title="Durations" bins={bins} />);
    expect(slots(container, "histogram-bar")).toHaveLength(3);
  });

  it("a barra do bin mais populoso é a mais alta", () => {
    const { container } = render(<Histogram title="Durations" bins={bins} />);
    const rects = Array.from(slots(container, "histogram-bar")) as SVGRectElement[];
    const heights = rects.map((r) => Number(r.getAttribute("height")));
    // bin[1] (count 5) é o pico
    expect(heights[1]).toBe(Math.max(...heights));
  });

  it("aceita values+binCount e produz o mesmo nº de barras que bins pré-computados", () => {
    const { container } = render(
      <Histogram title="Durations" values={[0, 1, 2, 11, 12, 13, 14, 21]} binCount={3} />,
    );
    expect(slots(container, "histogram-bar")).toHaveLength(3);
  });

  it("expõe role=img com o título no aria-label", () => {
    render(<Histogram title="Latency distribution" bins={bins} />);
    expect(screen.getByRole("img", { name: /latency distribution/i })).toBeInTheDocument();
  });

  it("distribuição vazia mostra empty state honesto", () => {
    const { container } = render(<Histogram title="Durations" bins={[]} />);
    expect(slots(container, "histogram-empty")).toHaveLength(1);
    expect(slots(container, "histogram-bar")).toHaveLength(0);
  });

  it("values vazio também mostra empty state", () => {
    const { container } = render(<Histogram title="Durations" values={[]} binCount={5} />);
    expect(slots(container, "histogram-empty")).toHaveLength(1);
  });

  it("tem tabela sr-only com uma linha por bin (paridade a11y do SVG)", () => {
    const { container } = render(<Histogram title="Durations" bins={bins} />);
    const rows = container.querySelectorAll('[data-slot="histogram-table"] tbody tr');
    expect(rows).toHaveLength(3);
  });

  it("encaminha ref para o elemento raiz", () => {
    const ref = createRef<HTMLElement>();
    render(<Histogram title="Durations" bins={bins} ref={ref} />);
    expect(ref.current).not.toBeNull();
    expect(ref.current?.getAttribute("data-slot")).toBe("histogram");
  });

  it("é exportado pelo barrel raiz", () => {
    expect(HistogramFromBarrel).toBe(Histogram);
  });

  it("não tem violações axe", async () => {
    const { container } = render(<Histogram title="Durations" bins={bins} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("não tem violações axe no empty state", async () => {
    const { container } = render(<Histogram title="Durations" bins={[]} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
