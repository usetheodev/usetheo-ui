import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { TokenCostBreakdown as TokenCostBreakdownFromBarrel } from "../../../index.js";
import { TokenCostBreakdown } from "./token-cost-breakdown.js";

const slots = (container: HTMLElement, slot: string) =>
  container.querySelectorAll(`[data-slot="${slot}"]`);

describe("TokenCostBreakdown", () => {
  it("test_renderiza_input_output_cache_e_custo", () => {
    render(
      <TokenCostBreakdown
        inputTokens={1200}
        outputTokens={340}
        cacheTokens={80}
        totalTokens={1620}
        costUsd={0.0234}
      />,
    );
    expect(screen.getByTestId("tcb-input")).toHaveTextContent("1200");
    expect(screen.getByTestId("tcb-output")).toHaveTextContent("340");
    expect(screen.getByTestId("tcb-cache")).toHaveTextContent("80");
    expect(screen.getByTestId("tcb-total")).toHaveTextContent("1620");
    expect(screen.getByTestId("tcb-cost")).toHaveTextContent("$0.0234");
  });

  it("test_zero_real_mostra_zero_nao_em_dash", () => {
    render(<TokenCostBreakdown inputTokens={0} costUsd={0} />);
    expect(screen.getByTestId("tcb-input")).toHaveTextContent("0");
    expect(screen.getByTestId("tcb-input")).not.toHaveTextContent("—");
    expect(screen.getByTestId("tcb-cost")).toHaveTextContent("$0.0000");
  });

  it("test_ausente_mostra_em_dash", () => {
    // input present so the list renders; cache absent → em-dash (honest, not 0)
    render(<TokenCostBreakdown inputTokens={5} />);
    expect(screen.getByTestId("tcb-cache")).toHaveTextContent("—");
    expect(screen.getByTestId("tcb-output")).toHaveTextContent("—");
    expect(screen.getByTestId("tcb-cost")).toHaveTextContent("—");
  });

  it("test_custo_formatado_quatro_casas", () => {
    render(<TokenCostBreakdown costUsd={1.5} />);
    expect(screen.getByTestId("tcb-cost")).toHaveTextContent("$1.5000");
  });

  it("test_todos_ausentes_empty_honesto", () => {
    const { container } = render(<TokenCostBreakdown />);
    expect(slots(container, "token-cost-breakdown-empty")).toHaveLength(1);
    expect(slots(container, "token-cost-breakdown")).toHaveLength(0);
  });

  it("test_encaminha_ref", () => {
    const ref = createRef<HTMLDListElement>();
    render(<TokenCostBreakdown inputTokens={1} ref={ref} />);
    expect(ref.current).not.toBeNull();
    expect(ref.current?.getAttribute("data-slot")).toBe("token-cost-breakdown");
  });

  it("test_exportado_pelo_barrel", () => {
    expect(TokenCostBreakdownFromBarrel).toBe(TokenCostBreakdown);
  });

  it("test_sem_violacoes_axe", async () => {
    const { container } = render(
      <TokenCostBreakdown inputTokens={10} outputTokens={20} totalTokens={30} costUsd={0.01} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("test_sem_violacoes_axe_no_empty", async () => {
    const { container } = render(<TokenCostBreakdown />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
