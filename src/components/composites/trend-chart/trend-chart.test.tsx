import { render } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { TrendChart as TrendChartFromBarrel } from "../../../index.js";
import type { TrendSeries } from "./trend-chart.js";
import { TrendChart, linScale, niceMax, pontosComMarcador, seriesPath } from "./trend-chart.js";
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
   * O docblock deste arquivo já declara que "non-finite points are skipped in the line and read as
   * `—` in the table", e `niceMax`, `hasData` e a tabela acessível honram isso. `seriesPath` era o
   * único que desmentia: ele FILTRAVA o ponto não-finito — apagando a informação de ONDE estava o
   * buraco — e então ligava os sobreviventes com `L`, desenhando linha contínua por cima da lacuna.
   *
   * Quebrar é a convenção de toda biblioteca séria: `spanGaps` (Chart.js), `connectNulls`
   * (Highcharts, ECharts, Recharts) e `connectgaps` (Plotly) são `false` por padrão, e o Grafana usa
   * "Connect null values: Never". E é a única leitura honesta — ligar afirma continuidade que o dado
   * não tem.
   */
  it("seriesPath quebra a linha na lacuna", () => {
    const id = (v: number) => v;
    const d = seriesPath(pts(1, undefined, 3), id, id);
    // DOIS subcaminhos: um antes da lacuna, outro depois
    expect(d.split("M")).toHaveLength(3); // "" + dois trechos
    expect(d).not.toMatch(/M[^M]*L[^M]*L/); // nenhum trecho com 3 pontos ligados
  });

  it("seriesPath sem lacuna segue UM subcaminho", () => {
    const id = (v: number) => v;
    const d = seriesPath(pts(1, 2, 3), id, id);
    // trava a nao-regressao: todo grafico existente tem serie densa
    expect(d.split("M")).toHaveLength(2);
    expect(d.split("L")).toHaveLength(3);
  });

  it("seriesPath com lacuna na ponta nao cria subcaminho vazio", () => {
    const id = (v: number) => v;
    for (const d of [
      seriesPath(pts(undefined, 1, 2), id, id),
      seriesPath(pts(1, 2, undefined), id, id),
    ]) {
      expect(d.split("M")).toHaveLength(2);
      expect(d.trimEnd().endsWith("M")).toBe(false);
    }
  });

  it("seriesPath com lacunas consecutivas produz DOIS subcaminhos, nao tres", () => {
    const id = (v: number) => v;
    // um trecho vazio nao e um trecho
    expect(seriesPath(pts(1, undefined, undefined, 4), id, id).split("M")).toHaveLength(3);
  });

  it("seriesPath com ponto isolado entre lacunas produz um M sozinho", () => {
    const id = (v: number) => v;
    const d = seriesPath(pts(undefined, 2, undefined), id, id);
    expect(d.split("M")).toHaveLength(2);
    expect(d).not.toContain("L"); // uma linha de um ponto so nao tem comprimento
  });

  /**
   * O teste acima prova que o ponto isolado vira `M` sozinho — e um `M` sozinho DESENHA NADA.
   * Medido no e2e do M144: uma série densa de 30 dias com dois dias finitos separados por lacuna
   * renderizou `d="M419.86,92.00 M448.00,36.00"`, um `path` de bounding-box zero que o navegador
   * reporta como não-visível. O dado existe, está correto, e o operador não vê nada.
   *
   * A regra antiga chaveava no TOTAL de pontos (`< SPARSE_MARKER_MAX`), não em se o ponto de fato
   * é desenhado — o próprio comentário dela dizia "a dot keeps real data from rendering as an
   * invisible line", intenção que ela não cumpria depois da densificação. Chart.js e Plotly marcam
   * o ponto isolado exatamente por isto.
   */
  it("ponto isolado entre lacunas GANHA marcador mesmo em serie densa", () => {
    const densa = pts(1, undefined, 3, undefined, ...Array.from({ length: 20 }, () => undefined));
    const marcados = pontosComMarcador(densa);
    expect(marcados.map((p) => p.y)).toEqual([1, 3]);
  });

  it("ponto com vizinho finito NAO ganha marcador — a linha ja o desenha", () => {
    const densa = pts(1, 2, 3, undefined, ...Array.from({ length: 20 }, () => undefined));
    // 1 e 2 e 3 sao contiguos: a linha os liga. Marcar todos poluiria a serie densa.
    expect(pontosComMarcador(densa)).toEqual([]);
  });

  it("ponta e isolada quando seu unico vizinho e lacuna", () => {
    expect(pontosComMarcador(pts(1, undefined, undefined)).map((p) => p.y)).toEqual([1]);
    expect(pontosComMarcador(pts(undefined, undefined, 9)).map((p) => p.y)).toEqual([9]);
  });

  it("serie esparsa segue marcando TODOS os pontos finitos (regra do M76 preservada)", () => {
    // 1-4 baldes leem como um penhasco sem marcador — a regra antiga continua valendo aqui.
    expect(pontosComMarcador(pts(1, 2, 3)).map((p) => p.y)).toEqual([1, 2, 3]);
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
