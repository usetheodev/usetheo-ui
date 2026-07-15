/**
 * PURE, deterministic layered layout for the agent-graph view. No I/O, no
 * React: derives each span's semantic kind, lays the trace out as a layered
 * node-edge graph (depth = distance from root, order = index within depth),
 * flags the root→selected execution path, and caps huge traces — so the SVG
 * renderer stays thin. SVG-pure by ADR D4 of the blueprint (no elkjs/d3).
 */

import { isSpanError } from "./duration.js";
import { flattenAll } from "./flatten.js";
import type { SpanKind, TraceSpan } from "./types.js";

function attr(span: TraceSpan, key: string): string | undefined {
  const a = span.attributes;
  if (a == null || typeof a !== "object") return undefined;
  const v = (a as Record<string, unknown>)[key];
  return typeof v === "string" ? v : undefined;
}

/**
 * Derive a span's semantic kind from OTel GenAI signals (the raw `.kind`
 * field is often the OTLP numeric — useless as agent/tool/LLM). Precedence:
 * tool > retriever > embedding > llm > chain(has children) > unknown.
 */
export function deriveSpanKind(span: TraceSpan): SpanKind {
  const operationName = attr(span, "gen_ai.operation.name");
  const toolName = attr(span, "gen_ai.tool.name");
  const hasChildren = (span.children?.length ?? 0) > 0;
  if (toolName != null || operationName === "execute_tool") return "tool";
  if (operationName === "retrieve" || operationName === "search") return "retriever";
  if (operationName === "embeddings" || operationName === "embedding") return "embedding";
  if (operationName === "chat" || operationName === "text_completion" || span.model != null)
    return "llm";
  if (hasChildren) return "chain";
  return "unknown";
}

/** Above this span count the graph renders an honest "too large" state. */
export const GRAPH_NODE_CAP = 200;

// Deterministic order/depth grid spacing (px) — the SVG viewport scales to fit.
const NODE_X_GAP = 168;
const NODE_Y_GAP = 96;

export interface GraphNode {
  spanId: string;
  name: string;
  kind: SpanKind;
  depth: number;
  order: number;
  x: number;
  y: number;
  error: boolean;
  selected: boolean;
  onPath: boolean;
}
export interface GraphEdge {
  from: string;
  to: string;
  onPath: boolean;
}
export interface LayeredGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  width: number;
  height: number;
  truncated: boolean;
  count: number;
}

/**
 * Build the deterministic layered graph. Edges come from parent/call order
 * (`parentId`), NOT the nested `children[]`, so malformed inputs are honest:
 * a self-loop or cycle is broken by a visited set; a span whose `parentId`
 * is absent from the trace is attached under the root, never dropped.
 * `onPath` = root→selected ancestor chain; with no selection, root→deepest
 * leaf. Over `cap` spans → `{ truncated: true, nodes: [], edges: [] }`.
 */
export function buildLayeredGraph(
  root: TraceSpan,
  selectedId?: string,
  cap = GRAPH_NODE_CAP,
): LayeredGraph {
  // Dedup by id (a malformed tree may repeat a span) — first occurrence wins.
  const seenIds = new Set<string>();
  const all = flattenAll(root).filter((s) => {
    if (seenIds.has(s.id)) return false;
    seenIds.add(s.id);
    return true;
  });
  const count = all.length;
  if (count > cap) {
    return { nodes: [], edges: [], width: 0, height: 0, truncated: true, count };
  }
  const byId = new Map(all.map((s) => [s.id, s]));

  // Effective parent: valid, non-self, present — else the root.
  const parentOf = new Map<string, string>();
  const childrenOf = new Map<string, string[]>();
  for (const s of all) {
    if (s.id === root.id) continue;
    const p = s.parentId;
    const eff = p != null && p !== s.id && byId.has(p) ? p : root.id;
    parentOf.set(s.id, eff);
    let bucket = childrenOf.get(eff);
    if (!bucket) {
      bucket = [];
      childrenOf.set(eff, bucket);
    }
    bucket.push(s.id);
  }

  // BFS from root → depth + order, with a visited guard (cycle-safe).
  const depthOf = new Map<string, number>();
  const orderOf = new Map<string, number>();
  const perDepth = new Map<number, number>();
  const visited = new Set<string>([root.id]);
  const queue: Array<{ id: string; depth: number }> = [{ id: root.id, depth: 0 }];
  let maxDepth = 0;
  while (queue.length > 0) {
    const item = queue.shift();
    if (!item) break;
    const order = perDepth.get(item.depth) ?? 0;
    perDepth.set(item.depth, order + 1);
    depthOf.set(item.id, item.depth);
    orderOf.set(item.id, order);
    maxDepth = Math.max(maxDepth, item.depth);
    for (const child of childrenOf.get(item.id) ?? []) {
      if (visited.has(child)) continue;
      visited.add(child);
      queue.push({ id: child, depth: item.depth + 1 });
    }
  }

  // Re-attach any node BFS never reached (cycle excluding the root) under the
  // root at depth 1 — an honest degraded view, shown + connected, never piled.
  for (const s of all) {
    if (depthOf.has(s.id)) continue;
    const order = perDepth.get(1) ?? 0;
    perDepth.set(1, order + 1);
    depthOf.set(s.id, 1);
    orderOf.set(s.id, order);
    parentOf.set(s.id, root.id);
    maxDepth = Math.max(maxDepth, 1);
  }

  const pathSet = new Set(computePath(root.id, selectedId, parentOf, depthOf, byId));

  const nodes: GraphNode[] = all.map((s) => {
    const depth = depthOf.get(s.id) ?? 0;
    const order = orderOf.get(s.id) ?? 0;
    return {
      spanId: s.id,
      name: s.name,
      kind: deriveSpanKind(s),
      depth,
      order,
      x: order * NODE_X_GAP,
      y: depth * NODE_Y_GAP,
      error: isSpanError(s.status),
      selected: selectedId != null && s.id === selectedId,
      onPath: pathSet.has(s.id),
    };
  });
  const edges: GraphEdge[] = all
    .filter((s) => s.id !== root.id)
    .map((s) => {
      const from = parentOf.get(s.id) ?? root.id;
      return { from, to: s.id, onPath: pathSet.has(from) && pathSet.has(s.id) };
    });

  const width = Math.max(1, ...Array.from(perDepth.values())) * NODE_X_GAP;
  const height = (maxDepth + 1) * NODE_Y_GAP;
  return { nodes, edges, width, height, truncated: false, count };
}

/** The ancestor chain root→selected; with no selection, root→deepest-leaf (BFS-order tie-break). */
function computePath(
  rootId: string,
  selectedId: string | undefined,
  parentOf: Map<string, string>,
  depthOf: Map<string, number>,
  byId: Map<string, TraceSpan>,
): string[] {
  let target = selectedId != null && byId.has(selectedId) ? selectedId : undefined;
  if (target === undefined) {
    let deepest = rootId;
    let best = -1;
    for (const [id, d] of depthOf) {
      if (d > best) {
        best = d;
        deepest = id;
      }
    }
    target = deepest;
  }
  const chain: string[] = [];
  const seen = new Set<string>();
  let cur: string | undefined = target;
  while (cur != null && !seen.has(cur)) {
    seen.add(cur);
    chain.push(cur);
    if (cur === rootId) break;
    cur = parentOf.get(cur);
  }
  return chain;
}

/** Kind → display label. */
export const KIND_LABEL: Record<SpanKind, string> = {
  llm: "LLM",
  tool: "Tool",
  retriever: "Retriever",
  embedding: "Embedding",
  agent: "Agent",
  chain: "Chain",
  reranker: "Reranker",
  evaluator: "Evaluator",
  guardrail: "Guardrail",
  unknown: "Span",
};
