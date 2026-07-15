import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { expectNoA11yViolations } from "../../../test/a11y.js";
import { MALFORMED_TRACE, NESTED_TRACE, makeTrace } from "../../../test/fixtures/trace.js";
import { SpanGraph } from "./index.js";

const props = (over: Partial<React.ComponentProps<typeof SpanGraph>> = {}) => ({
  root: NESTED_TRACE,
  selectedId: "root" as string | null,
  onSelect: () => {},
  ...over,
});

describe("SpanGraph", () => {
  it("test_renderiza_node_por_span_e_edge_por_parentesco", () => {
    const { container } = render(<SpanGraph {...props()} />);
    const nodes = container.querySelectorAll('[data-slot="span-graph-node"]');
    const edges = container.querySelectorAll('[data-slot="span-graph-edge"]');
    expect(nodes).toHaveLength(5); // NESTED_TRACE flattens to 5 spans
    expect(edges).toHaveLength(4); // 4 non-root spans → 4 edges
  });

  it("test_oversize_mostra_estado_honesto_sem_render", () => {
    render(<SpanGraph {...props({ root: makeTrace(250) })} />);
    expect(screen.getByText(/too large/i)).toBeInTheDocument();
  });

  it("test_parent_malformado_ainda_renderiza", () => {
    const { container } = render(<SpanGraph {...props({ root: MALFORMED_TRACE })} />);
    const orphan = container.querySelector('[data-slot="span-graph-node"][data-span-id="orphan"]');
    expect(orphan).toBeInTheDocument();
  });

  it("test_skew_e_in_flight_renderizam_sem_throw_no_componente", () => {
    // MALFORMED_TRACE carries a clock-skewed span + an in-flight (endTime null) span.
    const { container } = render(<SpanGraph {...props({ root: MALFORMED_TRACE })} />);
    expect(
      container.querySelector('[data-slot="span-graph-node"][data-span-id="skewed"]'),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[data-slot="span-graph-node"][data-span-id="inflight"]'),
    ).toBeInTheDocument();
  });

  it("test_node_click_seleciona", async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    const { container } = render(<SpanGraph {...props({ onSelect })} />);
    const node = container.querySelector(
      '[data-slot="span-graph-node"][data-span-id="plan"]',
    ) as HTMLElement;
    await user.click(node);
    expect(onSelect).toHaveBeenCalledWith("plan");
  });

  it("test_span_com_erro_marca_data_error", () => {
    const { container } = render(<SpanGraph {...props()} />);
    expect(
      container.querySelector('[data-slot="span-graph-node"][data-error="true"]'),
    ).toBeInTheDocument();
  });

  it("test_svg_tem_role_e_label", () => {
    render(<SpanGraph {...props()} />);
    expect(screen.getByRole("group", { name: /agent graph/i })).toBeInTheDocument();
  });

  it("has no a11y violations", async () => {
    await expectNoA11yViolations(<SpanGraph {...props()} />);
  });
});
