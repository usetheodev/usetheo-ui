import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import { type AttributeGroup, groupByNamespace } from "../../../lib/trace/attributes.js";
import { Badge } from "../../primitives/badge/index.js";
import { Button } from "../../primitives/button/index.js";
import { Card } from "../../primitives/card/index.js";
import { CopyButton } from "../../primitives/copy-button/index.js";
import { EmptyState } from "../../primitives/empty-state/index.js";
import { JsonViewer } from "../../primitives/json-viewer/index.js";

export interface AttributesTableProps {
  attrs?: Record<string, unknown>;
  /** Predicate marking a key's value as sensitive (masked fail-closed). Default: nothing masked. */
  maskedKeys?: (key: string) => boolean;
  /** Whether the viewer is authorized to reveal masked values. Default false (fail-closed). */
  canReveal?: boolean;
  /** Keys promoted to a badge header above the namespace cards. */
  promoted?: string[];
  /** Namespace cards start expanded. Default true. */
  defaultOpen?: boolean;
}

/**
 * AttributesTable — namespace-grouped OTel span attributes with fail-closed
 * PII masking. A `maskedKeys`-flagged value renders as `•••`; its raw string
 * NEVER enters the DOM (no text node, no title/aria/data) until Reveal is
 * clicked AND `canReveal` is true, and its CopyButton is withheld until then.
 * When `!canReveal` the reveal control is a quiet "masked" hint, not an inert
 * button. Object values fall back to the dependency-free `JsonViewer`.
 */
export function AttributesTable({
  attrs,
  maskedKeys,
  canReveal = false,
  promoted = [],
  defaultOpen = true,
}: AttributesTableProps) {
  const safe = attrs ?? {};
  const groups = groupByNamespace(safe);
  const badges = promoted.filter((k) => k in safe).map((k) => ({ key: k, value: safe[k] }));

  if (groups.length === 0) {
    return <EmptyState title="No attributes" description="This span records none." />;
  }

  return (
    <div className="space-y-2" data-slot="attributes-table">
      {badges.length > 0 ? (
        <div className="flex flex-wrap items-center gap-1.5" data-testid="attributes-badges">
          {badges.map((b) => (
            <Badge key={b.key} variant="outline" title={b.key}>
              {typeof b.value === "string" ? b.value : JSON.stringify(b.value)}
            </Badge>
          ))}
        </div>
      ) : null}
      {groups.map((group) => (
        <NamespaceCard
          key={group.namespace}
          group={group}
          canReveal={canReveal}
          maskedKeys={maskedKeys}
          defaultOpen={defaultOpen}
        />
      ))}
    </div>
  );
}

function NamespaceCard({
  group,
  canReveal,
  maskedKeys,
  defaultOpen,
}: {
  group: AttributeGroup;
  canReveal: boolean;
  maskedKeys?: (key: string) => boolean;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card size="sm">
      <Card.Header className="p-0">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-expanded={open}
          aria-label={`${open ? "Collapse" : "Expand"} ${group.namespace}`}
          onClick={() => setOpen((o) => !o)}
          className="w-full justify-start gap-1.5"
        >
          {open ? (
            <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5" />
          )}
          <span className="font-mono font-semibold text-xs">
            {`${group.namespace} (${group.entries.length})`}
          </span>
        </Button>
      </Card.Header>
      {open ? (
        <Card.Body className="pt-1">
          <dl className="grid grid-cols-1 gap-1 text-xs">
            {group.entries.map(([key, value]) => (
              <AttributeRow
                key={key}
                attrKey={key}
                value={value}
                masked={maskedKeys?.(key) ?? false}
                canReveal={canReveal}
              />
            ))}
          </dl>
        </Card.Body>
      ) : null}
    </Card>
  );
}

function AttributeRow({
  attrKey,
  value,
  masked,
  canReveal,
}: {
  attrKey: string;
  value: unknown;
  masked: boolean;
  canReveal: boolean;
}) {
  return (
    <div className="flex items-start gap-2">
      <dt className="w-40 shrink-0 truncate font-mono text-muted-foreground" title={attrKey}>
        {attrKey}
      </dt>
      <dd className="flex min-w-0 flex-1 items-center gap-1.5">
        {masked ? (
          <MaskedValue value={String(value)} canReveal={canReveal} />
        ) : (
          <PlainValue value={value} attrKey={attrKey} />
        )}
      </dd>
    </div>
  );
}

function PlainValue({ value, attrKey }: { value: unknown; attrKey: string }) {
  if (value !== null && typeof value === "object") {
    return <JsonViewer value={value} collapsed={1} enableCopy />;
  }
  const text = String(value);
  return (
    <>
      <span className="min-w-0 truncate font-mono">{text}</span>
      <CopyButton value={text} aria-label={`Copy ${attrKey}`} variant="ghost" size="sm" />
    </>
  );
}

/** Fail-closed PII value: pre-reveal the DOM holds ONLY `•••` + the control; the raw string never mounts. */
function MaskedValue({ value, canReveal }: { value: string; canReveal: boolean }) {
  const [revealed, setRevealed] = useState(false);
  if (revealed && canReveal) {
    return (
      <>
        <span className="min-w-0 truncate font-mono">{value}</span>
        <CopyButton value={value} aria-label="Copy value" variant="ghost" size="sm" />
      </>
    );
  }
  return (
    <>
      <span className="font-mono text-muted-foreground" aria-label="Masked value">
        •••
      </span>
      {canReveal ? (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          aria-label="Reveal masked value"
          title="Reveal"
          onClick={() => setRevealed(true)}
        >
          Reveal
        </Button>
      ) : (
        <span
          className="text-muted-foreground text-xs"
          title="You do not have permission to reveal this value"
        >
          masked
        </span>
      )}
    </>
  );
}
