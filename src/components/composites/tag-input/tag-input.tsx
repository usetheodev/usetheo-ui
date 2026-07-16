import { forwardRef, useId, useState } from "react";
import type { KeyboardEvent } from "react";
import { cn } from "../../../lib/cn.js";
import { Badge } from "../../primitives/badge/index.js";
import { Input } from "../../primitives/input/index.js";

/**
 * TagInput — controlled multi-value tag editor (M17).
 *
 * Renders one removable chip per tag (`Badge` + a per-tag "×" button) plus a
 * text input to add a new tag on Enter. Fully controlled: the consumer owns
 * `value: string[]` and handles `onChange`. Adding calls
 * `onChange([...value, tag])`; removing calls `onChange` without that tag.
 * Dedup is built-in — adding an existing (trimmed) tag is a no-op, and so is
 * an empty/whitespace tag. `disabled` blocks both add and remove.
 *
 * Design (ADR D2 + parsimony ladder rung 5): composes `Input` + `Badge` with
 * Enter-to-add rather than the single-select `Combobox`. `Combobox` is a
 * typeahead that selects ONE value from a fixed list and closes its own
 * listbox on select — it has no "create arbitrary tag" affordance, so a plain
 * input is both simpler and a better fit for free-text multi-value tags.
 * `suggestions` power a native `<datalist>` (zero-dep autocomplete).
 *
 *   <TagInput value={tags} onChange={setTags} suggestions={["bug", "feat"]} />
 */
export interface TagInputProps {
  /** Current tags (controlled). */
  value: string[];
  /** Called with the next tag list on add/remove. */
  onChange: (value: string[]) => void;
  /** Optional autocomplete suggestions surfaced via a native datalist. */
  suggestions?: string[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const TagInput = forwardRef<HTMLDivElement, TagInputProps>(
  ({ value, onChange, suggestions, placeholder, disabled, className }, ref) => {
    const [draft, setDraft] = useState("");
    const listId = useId();
    const hasSuggestions = suggestions !== undefined && suggestions.length > 0;

    const addTag = () => {
      const tag = draft.trim();
      // Empty/whitespace and duplicates are no-ops — never emit onChange.
      if (tag === "" || value.includes(tag)) {
        setDraft("");
        return;
      }
      onChange([...value, tag]);
      setDraft("");
    };

    const removeTag = (tag: string) => {
      if (disabled) return;
      onChange(value.filter((t) => t !== tag));
    };

    const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter") {
        event.preventDefault();
        addTag();
      }
    };

    return (
      <div
        data-slot="tag-input"
        ref={ref}
        className={cn("flex flex-wrap items-center gap-1.5", className)}
      >
        {value.map((tag) => (
          <Badge key={tag} data-testid="tag-input-chip" variant="primary" className="gap-1 pr-1">
            <span className="normal-case tracking-normal">{tag}</span>
            <button
              type="button"
              disabled={disabled}
              onClick={() => removeTag(tag)}
              aria-label={`Remove ${tag}`}
              className={cn(
                "inline-flex size-4 items-center justify-center rounded-full leading-none",
                "text-current/70 transition-colors hover:bg-primary/20 hover:text-current",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "disabled:cursor-not-allowed disabled:opacity-50",
              )}
            >
              <span aria-hidden="true">×</span>
            </button>
          </Badge>
        ))}
        <Input
          size="sm"
          className="w-auto min-w-[8rem] flex-1"
          value={draft}
          disabled={disabled}
          placeholder={placeholder}
          list={hasSuggestions ? listId : undefined}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={addTag}
        />
        {hasSuggestions ? (
          <datalist id={listId}>
            {suggestions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        ) : null}
      </div>
    );
  },
);
TagInput.displayName = "TagInput";

export { TagInput };
