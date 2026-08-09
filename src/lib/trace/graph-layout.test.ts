import { describe, expect, it } from "vitest";
import { GRAPH_NODE_CAP, buildLayeredGraph, deriveSpanKind } from "./graph-layout.js";
import type { TraceSpan } from "./types.js";

const span = (over: Partial<TraceSpan>): TraceSpan => ({
  id: over.id ?? "span-1",
  parentId: over.parentId ?? null,
  name: over.name ?? "op",
  ...over,
});

describe("deriveSpanKind", () => {
  it("test_tool_takes_precedence_over_llm", () => {
    expect(
      deriveSpanKind(span({ attributes: { "gen_ai.tool.name": "search" }, model: "gpt" })),
    ).toBe("tool");
    expect(deriveSpanKind(span({ model: "gpt" }))).toBe("llm");
    expect(deriveSpanKind(span({ attributes: { "gen_ai.operation.name": "retrieve" } }))).toBe(
      "retriever",
    );
    expect(deriveSpanKind(span({ children: [span({ id: "k" })] }))).toBe("chain");
    expect(deriveSpanKind(span({}))).toBe("unknown");
  });
});

describe("buildLayeredGraph", () => {
  it("test_a_deterministic_bfs_x_by_order_y_by_depth", () => {
    const root = span({
      id: "root",
      children: [span({ id: "a", parentId: "root" }), span({ id: "b", parentId: "root" })],
    });
    const g = buildLayeredGraph(root);
    const a = g.nodes.find((n) => n.spanId === "a");
    const b = g.nodes.find((n) => n.spanId === "b");
    expect(a?.y).toBe(b?.y);
    expect(a?.x).not.toBe(b?.x);
    expect(g.edges).toHaveLength(2);
  });

  it("test_a_malformed_parent_becomes_a_root_never_dropped", () => {
    const root = span({
      id: "root",
      children: [span({ id: "orphan", parentId: "ghost-does-not-exist" })],
    });
    const g = buildLayeredGraph(root);
    const orphan = g.nodes.find((n) => n.spanId === "orphan");
    expect(orphan).toBeDefined();
    expect(g.edges).toContainEqual(expect.objectContaining({ from: "root", to: "orphan" }));
  });

  it("test_oversize_returns_an_honest_truncated_result", () => {
    const children = Array.from({ length: GRAPH_NODE_CAP + 1 }, (_, i) =>
      span({ id: `s${i}`, parentId: "root" }),
    );
    const g = buildLayeredGraph(span({ id: "root", children }));
    expect(g.truncated).toBe(true);
    expect(g.nodes).toHaveLength(0);
  });

  it("test_a_self_loop_does_not_hang_the_layout", () => {
    const root = span({ id: "root", children: [span({ id: "self", parentId: "self" })] });
    const g = buildLayeredGraph(root);
    expect(g.nodes.find((n) => n.spanId === "self")).toBeDefined(); // the node is preserved, not dropped
    expect(g.nodes).toHaveLength(2);
  });

  it("test_on_path_marks_the_chain_from_root_to_selected", () => {
    const root = span({
      id: "root",
      children: [span({ id: "a", parentId: "root", children: [span({ id: "b", parentId: "a" })] })],
    });
    const g = buildLayeredGraph(root, "b");
    expect(
      g.nodes
        .filter((n) => n.onPath)
        .map((n) => n.spanId)
        .sort(),
    ).toEqual(["a", "b", "root"]);
  });
});
