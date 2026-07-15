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
  it("test_renderiza_uma_barra_para_cada_span_visivel", () => {
    const { container } = render(<SpanWaterfall {...props()} />);
    const bars = container.querySelectorAll('[data-slot="span-waterfall-row"]');
    expect(bars).toHaveLength(flattenVisible(NESTED_TRACE, new Set()).length);
  });

  it("test_barra_posicionada_por_compute_bar_layout", () => {
    const { container } = render(<SpanWaterfall {...props()} />);
    const bar = container.querySelector('[data-slot="span-waterfall-bar"]') as HTMLElement;
    expect(bar.style.left).toMatch(/%$/);
    expect(bar.style.width).toContain("%");
  });

  it("test_span_com_erro_usa_cor_destructive", () => {
    const { container } = render(<SpanWaterfall {...props()} />);
    const errBar = container.querySelector('[data-slot="span-waterfall-bar"][data-error="true"]');
    expect(errBar).toBeInTheDocument();
  });

  it("test_clicar_na_barra_seleciona_o_span", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<SpanWaterfall {...props({ onSelect })} />);
    await user.click(screen.getByRole("button", { name: /Timeline: llm\.plan/i }));
    expect(onSelect).toHaveBeenCalledWith("plan");
  });

  it("test_renderiza_o_eixo_de_tempo_com_ticks", () => {
    const { container } = render(<SpanWaterfall {...props()} />);
    expect(container.querySelectorAll('[data-slot="span-waterfall-tick"]').length).toBeGreaterThan(
      0,
    );
  });

  it("test_span_in_flight_marca_barra_unbounded", () => {
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

  it("test_janela_zero_duration_nao_lanca", () => {
    const zero = { id: "root", parentId: null, name: "z", startTime: 5n, endTime: 5n };
    expect(() =>
      render(<SpanWaterfall {...props({ root: zero, selectedId: "root" })} />),
    ).not.toThrow();
  });

  it("has no a11y violations", async () => {
    await expectNoA11yViolations(<SpanWaterfall {...props()} />);
  });
});
