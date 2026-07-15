import { Command as CommandPrimitive, useCommandState } from "cmdk";
import { Check, Loader2 } from "lucide-react";
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import type {
  ComponentPropsWithoutRef,
  ForwardedRef,
  HTMLAttributes,
  KeyboardEvent,
  ReactNode,
} from "react";
import { cn } from "../../../lib/cn.js";
import { inputVariants } from "../input/input.js";

/**
 * Combobox — single-select typeahead over the installed `cmdk` engine with an
 * inline listbox (blueprint ADR D2: no floating/popover machinery, zero new
 * deps; the list renders in-flow right below the input).
 *
 *   <Combobox value={collection} onValueChange={setCollection}>
 *     <Combobox.Input placeholder="Select a collection" />
 *     <Combobox.Content loading={isFetching}>
 *       <Combobox.Empty>No collections.</Combobox.Empty>
 *       {items.map((c) => <Combobox.Item key={c} value={c}>{c}</Combobox.Item>)}
 *     </Combobox.Content>
 *   </Combobox>
 *
 * Async filtering: pass `shouldFilter={false}` and feed pre-filtered items
 * (cmdk's documented pattern); flag `loading` on Content while fetching.
 *
 * Layout limitation (blueprint ADR D2): the listbox is positioned absolutely
 * right below the input — an ancestor with `overflow: hidden` will CLIP it.
 * Place the Combobox outside overflow-hidden containers (or give them room);
 * a floating/popover variant is a future milestone, not M1.
 */

interface ComboboxContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  value?: string;
  select: (value: string) => void;
  listId: string;
}

const ComboboxContext = createContext<ComboboxContextValue | null>(null);

/** Merges a local ref with the forwarded one (single shared helper for Root/Input). */
function composeRefs<T>(local: { current: T | null }, forwarded: ForwardedRef<T>) {
  return (node: T | null) => {
    local.current = node;
    if (typeof forwarded === "function") forwarded(node);
    else if (forwarded) forwarded.current = node;
  };
}

function useComboboxContext(sub: string): ComboboxContextValue {
  const ctx = useContext(ComboboxContext);
  if (!ctx) throw new Error(`<Combobox.${sub}> must be used inside <Combobox>`);
  return ctx;
}

interface ComboboxProps extends Omit<HTMLAttributes<HTMLDivElement>, "onChange"> {
  /** Selected value (controlled). */
  value?: string;
  onValueChange?: (value: string) => void;
  /** Listbox visibility (controlled). */
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Set false to disable cmdk's internal filter (async mode — consumer filters). */
  shouldFilter?: boolean;
  children: ReactNode;
}

const Root = forwardRef<HTMLDivElement, ComboboxProps>(
  (
    {
      className,
      children,
      value,
      onValueChange,
      open: openProp,
      defaultOpen = false,
      onOpenChange,
      shouldFilter = true,
      "aria-label": ariaLabel,
      ...props
    },
    ref,
  ) => {
    const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
    const open = openProp ?? uncontrolledOpen;
    const rootRef = useRef<HTMLDivElement | null>(null);
    const listId = useId();

    const setOpen = useCallback(
      (next: boolean) => {
        setUncontrolledOpen(next);
        onOpenChange?.(next);
      },
      [onOpenChange],
    );

    const select = useCallback(
      (next: string) => {
        onValueChange?.(next);
        setOpen(false);
      },
      [onValueChange, setOpen],
    );

    // Single root effect: close on mousedown outside (inline listbox has no
    // focus trap; APG combobox keeps focus on the input the whole time).
    useEffect(() => {
      if (!open) return;
      const onMouseDown = (event: MouseEvent) => {
        if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
          setOpen(false);
        }
      };
      document.addEventListener("mousedown", onMouseDown);
      return () => document.removeEventListener("mousedown", onMouseDown);
    }, [open, setOpen]);

    return (
      <ComboboxContext.Provider value={{ open, setOpen, value, select, listId }}>
        <div
          data-slot="combobox"
          ref={composeRefs(rootRef, ref)}
          className={cn("relative w-full", className)}
          {...props}
        >
          {/* cmdk renders an sr-only <label> from `label`, naming the input (axe-clean). */}
          <CommandPrimitive label={ariaLabel} shouldFilter={shouldFilter}>
            {children}
          </CommandPrimitive>
        </div>
      </ComboboxContext.Provider>
    );
  },
);
Root.displayName = "Combobox";

type ComboboxInputProps = ComponentPropsWithoutRef<typeof CommandPrimitive.Input>;

const Input = forwardRef<HTMLInputElement, ComboboxInputProps>(
  ({ className, onFocus, onKeyDown, onValueChange, ...props }, ref) => {
    const { open, setOpen, listId } = useComboboxContext("Input");
    const innerRef = useRef<HTMLInputElement | null>(null);

    // cmdk hardcodes role="combobox" + aria-expanded=true AFTER spreading
    // consumer props (dist/index.mjs Input), so the APG closed-state contract
    // (expanded=false, no dangling aria-controls) is enforced here, after
    // every commit — the attribute sync is idempotent.
    useEffect(() => {
      const el = innerRef.current;
      if (!el) return;
      el.setAttribute("aria-expanded", String(open));
      if (open) el.setAttribute("aria-controls", listId);
      else el.removeAttribute("aria-controls");
    });

    return (
      <CommandPrimitive.Input
        data-slot="combobox-input"
        ref={composeRefs(innerRef, ref)}
        className={cn(inputVariants({ size: "md" }), className)}
        onFocus={(event) => {
          setOpen(true);
          onFocus?.(event);
        }}
        onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
          if (event.key === "Escape") setOpen(false);
          onKeyDown?.(event);
        }}
        onValueChange={(search) => {
          if (!open) setOpen(true);
          onValueChange?.(search);
        }}
        {...props}
      />
    );
  },
);
Input.displayName = "Combobox.Input";

interface ComboboxContentProps extends HTMLAttributes<HTMLDivElement> {
  /** Async fetch in flight: shows the loading slot and hides items/empty. */
  loading?: boolean;
}

const Content = forwardRef<HTMLDivElement, ComboboxContentProps>(
  ({ className, children, loading, ...props }, ref) => {
    const { open, listId } = useComboboxContext("Content");
    const resultCount = useCommandState((state) => state.filtered.count);
    const listRef = useRef<HTMLDivElement | null>(null);

    // An empty listbox violates aria-required-children (axe); cmdk always
    // renders role="listbox". Same adapter pattern as the Input: demote the
    // role to presentation while there are no options, after every commit.
    useEffect(() => {
      const el = listRef.current;
      if (!el) return;
      // The input's aria-controls must reference the listbox element itself
      // (APG), so the shared listId lives here — same hardcoded-attrs adapter
      // rationale as the Input (cmdk assigns its own id after the spread).
      el.setAttribute("id", listId);
      if (resultCount === 0) {
        el.setAttribute("role", "presentation");
        el.removeAttribute("aria-label");
      } else {
        el.setAttribute("role", "listbox");
        if (!el.getAttribute("aria-label")) el.setAttribute("aria-label", "Suggestions");
      }
    });

    if (!open) return null;
    return (
      <div
        data-slot="combobox-content"
        ref={ref}
        className={cn(
          "absolute top-full z-50 mt-1 w-full rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-md",
          className,
        )}
        {...props}
      >
        {loading ? (
          <div
            data-slot="combobox-loading"
            id={listId}
            aria-busy="true"
            className="flex items-center justify-center gap-2 px-3 py-6 text-body-sm text-muted-foreground"
          >
            <Loader2 aria-hidden className="size-4 animate-spin" />
            Loading…
          </div>
        ) : (
          <CommandPrimitive.List ref={listRef} className="max-h-64 overflow-y-auto">
            {children}
          </CommandPrimitive.List>
        )}
      </div>
    );
  },
);
Content.displayName = "Combobox.Content";

type ComboboxItemProps = ComponentPropsWithoutRef<typeof CommandPrimitive.Item>;

const Item = forwardRef<HTMLDivElement, ComboboxItemProps>(
  ({ className, children, value, onSelect, ...props }, ref) => {
    const ctx = useComboboxContext("Item");
    const selected = value !== undefined && ctx.value === value;
    return (
      <CommandPrimitive.Item
        data-slot="combobox-item"
        data-selected-value={selected ? "true" : undefined}
        ref={ref}
        value={value}
        onSelect={(selectedValue) => {
          ctx.select(selectedValue);
          onSelect?.(selectedValue);
        }}
        className={cn(
          "flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-body-sm",
          "data-[selected=true]:bg-accent/10 data-[selected=true]:text-foreground",
          className,
        )}
        {...props}
      >
        {children}
        <Check
          aria-hidden
          className={cn("ml-auto size-4", selected ? "opacity-100" : "opacity-0")}
        />
      </CommandPrimitive.Item>
    );
  },
);
Item.displayName = "Combobox.Item";

type ComboboxEmptyProps = ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>;

const Empty = forwardRef<HTMLDivElement, ComboboxEmptyProps>(({ className, ...props }, ref) => (
  <CommandPrimitive.Empty
    data-slot="combobox-empty"
    ref={ref}
    className={cn("px-3 py-6 text-center text-body-sm text-muted-foreground", className)}
    {...props}
  />
));
Empty.displayName = "Combobox.Empty";

const Combobox = Object.assign(Root, { Input, Content, Item, Empty });

export { Combobox };
export type { ComboboxProps, ComboboxContentProps, ComboboxInputProps, ComboboxItemProps };
