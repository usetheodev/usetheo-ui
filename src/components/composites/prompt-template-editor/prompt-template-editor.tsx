import { forwardRef, useId } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "../../../lib/cn.js";
import { Badge, type BadgeProps } from "../../primitives/badge/index.js";
import { Textarea } from "../../primitives/textarea/index.js";
import { extractVars } from "./extract-vars.js";

/**
 * PromptTemplateEditor — a controlled template editor: a `Textarea` plus a
 * simple hint area listing available variables and which are used vs missing.
 *
 * The hint is a lightweight overlay over the plain textarea (M19 ADR D1 —
 * parsimony rung 5): variable detection uses the pure `extractVars` helper;
 * NO CodeMirror / editor library. "Used" = the variable appears in the current
 * value; "missing" = it is used in the value but not declared in `variables`.
 *
 *   <PromptTemplateEditor value={t} onChange={setT} variables={["name","city"]} />
 */
export interface PromptTemplateEditorProps
  extends Omit<HTMLAttributes<HTMLTextAreaElement>, "onChange"> {
  /** The template text. */
  value: string;
  /** Emits the new template text on each edit. */
  onChange: (value: string) => void;
  /** Variables the caller declares available to this template. */
  variables?: string[];
  /** Disable editing. */
  disabled?: boolean;
}

type VarChip = { name: string; used: boolean; missing: boolean };

/** Available ∪ used-but-undeclared, so both surfaces are visible to the author. */
function deriveChips(value: string, variables: string[]): VarChip[] {
  const used = new Set(extractVars(value));
  const declared = new Set(variables);
  // dedup declared vars via the Set so duplicate `variables` never yield duplicate chip keys
  const names = [...declared, ...[...used].filter((v) => !declared.has(v))];
  return names.map((name) => ({
    name,
    used: used.has(name),
    missing: used.has(name) && !declared.has(name),
  }));
}

function chipVariant(chip: VarChip): BadgeProps["variant"] {
  if (chip.missing) return "warning";
  return chip.used ? "success" : "outline";
}

const PromptTemplateEditor = forwardRef<HTMLTextAreaElement, PromptTemplateEditorProps>(
  ({ className, value, onChange, variables = [], disabled = false, ...props }, ref) => {
    const labelId = useId();
    const chips = deriveChips(value, variables);

    return (
      <div data-slot="prompt-template-editor" className={cn("flex flex-col gap-2", className)}>
        <span
          id={labelId}
          className="font-semibold text-label-caps text-muted-foreground uppercase"
        >
          Prompt template
        </span>
        <Textarea
          ref={ref}
          aria-labelledby={labelId}
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          {...props}
        />
        {chips.length > 0 ? (
          <div data-slot="prompt-template-editor-vars" className="flex flex-wrap gap-1.5">
            {chips.map((chip) => (
              <Badge
                key={chip.name}
                data-slot="prompt-template-editor-var"
                data-var={chip.name}
                data-used={String(chip.used)}
                data-missing={String(chip.missing)}
                variant={chipVariant(chip)}
                size="sm"
              >
                {chip.missing ? `${chip.name} (undeclared)` : chip.name}
              </Badge>
            ))}
          </div>
        ) : null}
      </div>
    );
  },
);
PromptTemplateEditor.displayName = "PromptTemplateEditor";

export { PromptTemplateEditor };
