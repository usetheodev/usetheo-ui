import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import type { TraceSpan } from "../../../lib/trace/types.js";
import { expectNoA11yViolations } from "../../../test/a11y.js";
import { TraceCompare } from "./index.js";

const T0 = 1_750_000_000_000_000_000n;
const NS = 1_000_000_000n;
const laneA: TraceSpan = {
  id: "a-root",
  parentId: null,
  name: "agent.run",
  startTime: T0,
  endTime: T0 + 4n * NS,
  inputTokens: 100,
  outputTokens: 40,
  costUsd: 0.01,
  children: [
    { id: "a1", parentId: "a-root", name: "tool.search", startTime: T0, endTime: T0 + 2n * NS },
  ],
};
const laneB: TraceSpan = {
  id: "b-root",
  parentId: null,
  name: "agent.run",
  startTime: T0,
  endTime: T0 + 8n * NS,
  inputTokens: 200,
  outputTokens: 90,
  costUsd: 0.03,
  children: [
    { id: "b1", parentId: "b-root", name: "tool.search", startTime: T0, endTime: T0 + 3n * NS },
    {
      id: "b2",
      parentId: "b-root",
      name: "tool.extra",
      startTime: T0 + 3n * NS,
      endTime: T0 + 5n * NS,
    },
  ],
};

describe("TraceCompare", () => {
  it("test_renderiza_duas_lanes", () => {
    render(<TraceCompare laneA={{ id: "A", root: laneA }} laneB={{ id: "B", root: laneB }} />);
    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
  });

  it("test_delta_de_metricas_mostra_direcao", () => {
    const { container } = render(
      <TraceCompare laneA={{ id: "A", root: laneA }} laneB={{ id: "B", root: laneB }} />,
    );
    // B is slower/costlier → a positive delta badge present
    expect(container.querySelector('[data-slot="delta-badge"]')).toBeInTheDocument();
  });

  it("test_span_so_em_b_marca_only_in", () => {
    render(<TraceCompare laneA={{ id: "A", root: laneA }} laneB={{ id: "B", root: laneB }} />);
    const row = screen.getByText("tool.extra").closest('[data-slot="diff-row"]');
    expect(within(row as HTMLElement).getByText(/only in b/i)).toBeInTheDocument();
  });

  it("test_lane_pending_mostra_skeleton_sem_delta", () => {
    const { container } = render(
      <TraceCompare
        laneA={{ id: "A", root: laneA }}
        laneB={{ id: "B", root: laneA, pending: true }}
      />,
    );
    expect(container.querySelector('[data-slot="lane-pending"]')).toBeInTheDocument();
    expect(container.querySelector('[data-slot="delta-badge"]')).toBeNull();
  });

  it("test_lanes_com_skew_e_ciclo_nao_lancam", () => {
    // A lane whose root has a clock-skewed child + a self-referential cycle must render honestly.
    const skewed: TraceSpan = {
      id: "s-root",
      parentId: null,
      name: "agent.run",
      startTime: T0,
      endTime: T0 + 2n * NS,
      children: [
        {
          id: "s1",
          parentId: "s-root",
          name: "tool.search",
          startTime: T0 + 3n * NS,
          endTime: T0 + NS,
        },
      ],
    };
    const cyclic: TraceSpan = { id: "c-root", parentId: null, name: "agent.run" };
    cyclic.children = [cyclic];
    expect(() =>
      render(<TraceCompare laneA={{ id: "A", root: skewed }} laneB={{ id: "B", root: cyclic }} />),
    ).not.toThrow();
  });

  it("has no a11y violations", async () => {
    await expectNoA11yViolations(
      <TraceCompare laneA={{ id: "A", root: laneA }} laneB={{ id: "B", root: laneB }} />,
    );
  });
});
