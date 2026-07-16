import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { PriceBreakdown as PriceBreakdownFromBarrel } from "../../../index.js";
import { PriceBreakdown } from "./price-breakdown.js";

const slots = (container: HTMLElement, slot: string) =>
  container.querySelectorAll(`[data-slot="${slot}"]`);

describe("PriceBreakdown", () => {
  it("test_uma_linha_por_preco", () => {
    const { container } = render(<PriceBreakdown prices={{ input: 0.000003, output: 0.000015 }} />);
    const rows = container.querySelectorAll('[data-slot="price-breakdown"] tbody tr');
    expect(rows).toHaveLength(2);
    expect(screen.getByText("input")).toBeInTheDocument();
    expect(screen.getByText("output")).toBeInTheDocument();
  });

  it("test_escala_1k_1m_correta", () => {
    render(<PriceBreakdown prices={{ input: 0.000003 }} />);
    // per-unit = 0.000003 ; per-1K = 0.003 ; per-1M = 3
    expect(screen.getByTestId("price-input-unit")).toHaveTextContent("0.000003");
    expect(screen.getByTestId("price-input-1k")).toHaveTextContent("0.003");
    expect(screen.getByTestId("price-input-1m")).toHaveTextContent("3");
  });

  it("test_prices_vazio_empty", () => {
    const { container } = render(<PriceBreakdown prices={{}} />);
    expect(slots(container, "price-breakdown-empty")).toHaveLength(1);
    expect(slots(container, "price-breakdown")).toHaveLength(0);
  });

  it("test_encaminha_ref", () => {
    const ref = createRef<HTMLTableElement>();
    render(<PriceBreakdown prices={{ input: 0.000003 }} ref={ref} />);
    expect(ref.current).not.toBeNull();
    expect(ref.current?.getAttribute("data-slot")).toBe("price-breakdown");
  });

  it("test_exportado_pelo_barrel", () => {
    expect(PriceBreakdownFromBarrel).toBe(PriceBreakdown);
  });

  it("test_sem_violacoes_axe", async () => {
    const { container } = render(
      <PriceBreakdown prices={{ input: 0.000003, output: 0.000015 }} unit="token" />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("test_sem_violacoes_axe_no_empty", async () => {
    const { container } = render(<PriceBreakdown prices={{}} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
