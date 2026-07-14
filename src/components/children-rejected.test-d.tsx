import { MetricCard } from "./composites/metric-card/index.js";
/**
 * M87 — type-level contract test. The six fixed-slot primitives render ONLY their named slots; they
 * must REJECT `children` at the type level so the #175 silent-body-drop is a compile error, not a
 * runtime data loss. Enforced by the kit's `tsc --noEmit` typecheck (this file is under `src/**`): each
 * `@ts-expect-error` below asserts that passing children is a type error — if a primitive stopped
 * rejecting children, the suppression would be UNUSED and `tsc` would fail here.
 *
 * This is a pure type test — it renders nothing at runtime (no vitest assertion needed; the compiler is
 * the assertion). The good-body forms are also included to prove the fixed-slot props still typecheck.
 */
import { Alert } from "./primitives/alert/index.js";
import { EmptyState } from "./primitives/empty-state/index.js";
import { PlanBadge } from "./primitives/plan-badge/index.js";
import { StatTile } from "./primitives/stat-tile/index.js";
import { UpdateBanner } from "./primitives/update-banner/index.js";

// ── children is REJECTED (the #175-class compile error) ─────────────────────────────────────────────
export const _rejects = (
  <>
    {/* @ts-expect-error — Alert renders no children; use `description` */}
    <Alert intent="warning">a silently-dropped body</Alert>
    {/* @ts-expect-error — EmptyState renders no children */}
    <EmptyState title="x">dropped</EmptyState>
    {/* @ts-expect-error — MetricCard renders no children */}
    <MetricCard title="x" value="1">
      dropped
    </MetricCard>
    {/* @ts-expect-error — StatTile renders no children */}
    <StatTile value="1" label="x">
      dropped
    </StatTile>
    {/* @ts-expect-error — PlanBadge renders its computed label, no children */}
    <PlanBadge plan="pro">dropped</PlanBadge>
    {/* @ts-expect-error — UpdateBanner renders no children */}
    <UpdateBanner currentVersion="1.0.0" latestVersion="1.1.0" onUpdate={() => {}}>
      dropped
    </UpdateBanner>
  </>
);

// ── the fixed-slot props still typecheck (no false positive) ────────────────────────────────────────
export const _accepts = (
  <>
    <Alert intent="warning" title="t" description="the body goes here" />
    <EmptyState title="t" description="d" />
    <MetricCard title="t" value="1" />
    <StatTile value="1" label="t" />
    <PlanBadge plan="pro" />
    <UpdateBanner currentVersion="1.0.0" latestVersion="1.1.0" onUpdate={() => {}} />
  </>
);
