import { useMemo } from "react";
import { cn } from "../../../lib/cn.js";
import {
  type AlignRow,
  type NumericDelta,
  alignSpanTrees,
  traceMetrics,
} from "../../../lib/trace/align.js";
import { formatDurationMs } from "../../../lib/trace/duration.js";
import type { TraceSpan } from "../../../lib/trace/types.js";
import { Badge } from "../../primitives/badge/index.js";
import { Card } from "../../primitives/card/index.js";
import { Skeleton } from "../../primitives/skeleton/index.js";

export interface CompareLane {
  /** Display label (e.g. a trace id). */
  id: string;
  root: TraceSpan;
  /** Data still loading — the lane renders a skeleton and no deltas compute. */
  pending?: boolean;
}

export interface TraceCompareProps {
  /** Baseline lane. */
  laneA: CompareLane;
  /** Compared lane (B vs A). */
  laneB: CompareLane;
  /** Custom aligner (default: structural `alignSpanTrees`). */
  align?: (a: TraceSpan, b: TraceSpan) => AlignRow[];
  /** USD cost formatter. Default `$0.0000`. */
  formatCostUsd?: (usd: number) => string;
  className?: string;
}

const defaultCost = (usd: number) => `$${usd.toFixed(4)}`;

/**
 * TraceCompare — two traces side by side (B vs A baseline): a metrics header
 * per lane and a structural diff table. Deltas are honest — a span present in
 * only one trace is marked `only in A/B` with no fabricated delta. The
 * component receives DATA (lanes); fetching/URL live in the consumer.
 */
export function TraceCompare({
  laneA,
  laneB,
  align = alignSpanTrees,
  formatCostUsd = defaultCost,
  className,
}: TraceCompareProps) {
  const pending = laneA.pending || laneB.pending;
  const rows = useMemo(
    () => (pending ? [] : align(laneA.root, laneB.root)),
    [pending, align, laneA.root, laneB.root],
  );

  return (
    <div className={cn("space-y-4", className)} data-slot="trace-compare">
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <LaneCard lane={laneA} formatCostUsd={formatCostUsd} />
        <LaneCard lane={laneB} formatCostUsd={formatCostUsd} />
      </div>
      {pending ? null : <DiffTable rows={rows} formatCostUsd={formatCostUsd} />}
    </div>
  );
}

function LaneCard({
  lane,
  formatCostUsd,
}: { lane: CompareLane; formatCostUsd: (u: number) => string }) {
  const m = useMemo(() => (lane.pending ? null : traceMetrics(lane.root)), [lane]);
  return (
    <Card size="sm">
      <Card.Header>
        <div className="flex items-center gap-2">
          <span className="font-mono font-semibold text-sm">{lane.id}</span>
          {m?.hasError ? <Badge variant="destructive">error</Badge> : null}
        </div>
      </Card.Header>
      <Card.Body>
        {lane.pending || !m ? (
          <div data-slot="lane-pending" className="space-y-2">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ) : (
          <dl className="grid grid-cols-3 gap-2 text-xs">
            <Stat label="Duration" value={formatDurationMs(m.durationMs)} />
            <Stat label="Tokens" value={String(m.totalTokens)} />
            <Stat label="Cost" value={formatCostUsd(m.costUsd)} />
          </dl>
        )}
      </Card.Body>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium font-mono">{value}</dd>
    </div>
  );
}

function DiffTable({
  rows,
  formatCostUsd,
}: { rows: AlignRow[]; formatCostUsd: (u: number) => string }) {
  return (
    <div className="overflow-hidden rounded-md border border-border">
      <table className="w-full text-xs">
        <thead className="bg-muted/40 text-muted-foreground">
          <tr>
            <th className="px-2 py-1 text-left font-medium">Span</th>
            <th className="px-2 py-1 text-right font-medium">Duration</th>
            <th className="px-2 py-1 text-right font-medium">Tokens</th>
            <th className="px-2 py-1 text-right font-medium">Cost</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={`${row.key}-${i}`} data-slot="diff-row" className="border-border border-t">
              <th
                scope="row"
                className="px-2 py-1 text-left font-mono font-normal"
                style={{ paddingLeft: `${row.depth * 12 + 8}px` }}
              >
                {row.key}
                {row.status !== "matched" ? (
                  <Badge variant="outline" className="ml-2">
                    {row.status === "only-in-a" ? "only in A" : "only in B"}
                  </Badge>
                ) : null}
              </th>
              <DeltaCell
                delta={row.delta?.durationMs}
                format={(n) => formatDurationMs(n)}
                lowerIsBetter
              />
              <DeltaCell
                delta={row.delta?.tokens}
                format={(n) => String(Math.round(n ?? 0))}
                lowerIsBetter
              />
              <DeltaCell
                delta={row.delta?.costUsd}
                format={(n) => formatCostUsd(n ?? 0)}
                lowerIsBetter
              />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DeltaCell({
  delta,
  format,
  lowerIsBetter,
}: {
  delta?: NumericDelta;
  format: (n: number | null) => string;
  lowerIsBetter: boolean;
}) {
  if (!delta) {
    return <td className="px-2 py-1 text-right text-muted-foreground">—</td>;
  }
  const { from, to, deltaPct } = delta;
  const worse = deltaPct !== null && (lowerIsBetter ? deltaPct > 0 : deltaPct < 0);
  return (
    <td className="px-2 py-1 text-right">
      <span className="font-mono text-muted-foreground">{format(from)}</span>
      <span className="mx-1 text-muted-foreground">→</span>
      <span className="font-mono">{format(to)}</span>
      {deltaPct !== null && Math.abs(deltaPct) >= 0.5 ? (
        <span
          data-slot="delta-badge"
          className={cn("ml-1 font-mono text-[10px]", worse ? "text-destructive" : "text-success")}
        >
          {deltaPct > 0 ? "+" : ""}
          {deltaPct.toFixed(0)}%
        </span>
      ) : null}
    </td>
  );
}
