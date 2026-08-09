import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { PriceBreakdown as PriceBreakdownFromBarrel } from "../../../index.js";
import { PriceBreakdown } from "./price-breakdown.js";

const slots = (container: HTMLElement, slot: string) =>
  container.querySelectorAll(`[data-slot="${slot}"]`);

describe("PriceBreakdown", () => {
  it("test_one_row_per_price", () => {
    const { container } = render(<PriceBreakdown prices={{ input: 0.000003, output: 0.000015 }} />);
    const rows = container.querySelectorAll('[data-slot="price-breakdown"] tbody tr');
    expect(rows).toHaveLength(2);
    expect(screen.getByText("input")).toBeInTheDocument();
    expect(screen.getByText("output")).toBeInTheDocument();
  });

  it("test_the_1k_1m_scale_is_correct", () => {
    render(<PriceBreakdown prices={{ input: 0.000003 }} />);
    // per-unit = 0.000003 ; per-1K = 0.003 ; per-1M = 3
    expect(screen.getByTestId("price-input-unit")).toHaveTextContent("0.000003");
    expect(screen.getByTestId("price-input-1k")).toHaveTextContent("0.003");
    expect(screen.getByTestId("price-input-1m")).toHaveTextContent("3");
  });

  it("test_empty_prices_show_the_empty_state", () => {
    const { container } = render(<PriceBreakdown prices={{}} />);
    expect(slots(container, "price-breakdown-empty")).toHaveLength(1);
    expect(slots(container, "price-breakdown")).toHaveLength(0);
  });

  it("test_forwards_ref", () => {
    const ref = createRef<HTMLTableElement>();
    render(<PriceBreakdown prices={{ input: 0.000003 }} ref={ref} />);
    expect(ref.current).not.toBeNull();
    expect(ref.current?.getAttribute("data-slot")).toBe("price-breakdown");
  });

  it("test_exported_from_the_barrel", () => {
    expect(PriceBreakdownFromBarrel).toBe(PriceBreakdown);
  });

  it("test_no_axe_violations", async () => {
    const { container } = render(
      <PriceBreakdown prices={{ input: 0.000003, output: 0.000015 }} unit="token" />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("test_no_axe_violations_in_the_empty_state", async () => {
    const { container } = render(<PriceBreakdown prices={{}} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
