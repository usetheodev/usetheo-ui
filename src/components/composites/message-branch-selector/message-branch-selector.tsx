import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import { cn } from "../../../lib/cn.js";
import { Button } from "../../primitives/button/index.js";

/**
 * MessageBranchSelector — controlled navigator across alternative message
 * branches (e.g. regenerated responses): "‹ 2 / 5 ›" with prev/next buttons.
 *
 * Fully controlled (M19 ADR D3): the consumer owns `index` and reacts to
 * `onPrev` / `onNext`; regenerate / streaming is a platform concern, not the DS.
 * Prev is disabled at the first branch, next at the last. With a single branch
 * (`count <= 1`) there is nothing to navigate, so it renders nothing.
 *
 *   <MessageBranchSelector index={i} count={branches.length}
 *     onPrev={() => setI(i - 1)} onNext={() => setI(i + 1)} />
 */
export interface MessageBranchSelectorProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Zero-based index of the active branch. */
  index: number;
  /** Total number of branches. */
  count: number;
  /** Navigate to the previous branch. */
  onPrev: () => void;
  /** Navigate to the next branch. */
  onNext: () => void;
  /** Disable both controls (e.g. while a branch is loading). */
  disabled?: boolean;
}

function NavButton(props: {
  label: string;
  glyph: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={props.label}
      disabled={props.disabled}
      onClick={props.onClick}
    >
      <span aria-hidden="true">{props.glyph}</span>
    </Button>
  );
}

const MessageBranchSelector = forwardRef<HTMLDivElement, MessageBranchSelectorProps>(
  ({ className, index, count, onPrev, onNext, disabled = false, ...props }, ref) => {
    // A single branch has nothing to navigate — render nothing honestly.
    if (count <= 1) return null;

    return (
      <div
        data-slot="message-branch-selector"
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1 text-body-sm text-muted-foreground",
          className,
        )}
        {...props}
      >
        <NavButton
          label="Previous branch"
          glyph="‹"
          disabled={disabled || index <= 0}
          onClick={onPrev}
        />
        <span data-slot="message-branch-selector-label" className="tabular-nums">
          {index + 1} / {count}
        </span>
        <NavButton
          label="Next branch"
          glyph="›"
          disabled={disabled || index >= count - 1}
          onClick={onNext}
        />
      </div>
    );
  },
);
MessageBranchSelector.displayName = "MessageBranchSelector";

export { MessageBranchSelector };
