import * as SliderPrimitive from "@radix-ui/react-slider";
import { forwardRef, useMemo, useState } from "react";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";

/**
 * Slider — range input primitive over Radix Slider.
 *
 * Single thumb: `defaultValue={[5]}`. Range: `defaultValue={[20, 80]}` (one
 * thumb per array entry). `marks` renders labelled, clickable points over the
 * track (Mantine-shaped `{value, label?}`); clicking a mark sets the value in
 * single mode and is a no-op in range mode (which thumb to move is ambiguous).
 *
 *   <Slider aria-label="Top K" min={1} max={100} defaultValue={[5]}
 *           marks={[{ value: 1 }, { value: 50 }, { value: 100 }]} />
 */

interface SliderMark {
  value: number;
  label?: ReactNode;
}

interface SliderProps extends ComponentPropsWithoutRef<typeof SliderPrimitive.Root> {
  /** Labelled, clickable points rendered over the track. Values outside [min, max] are skipped. */
  marks?: SliderMark[];
}

const Slider = forwardRef<HTMLSpanElement, SliderProps>(
  (
    {
      className,
      defaultValue,
      value,
      min = 0,
      max = 100,
      marks,
      disabled,
      onValueChange,
      "aria-label": ariaLabel,
      "aria-labelledby": ariaLabelledby,
      ...props
    },
    ref,
  ) => {
    // Radix does not clamp out-of-bounds entries; the wrapper guarantees
    // aria-valuenow always lands inside [min, max] (Mantine-pinned behavior).
    const clamp = (entries?: number[]) =>
      entries?.map((entry) => Math.min(Math.max(entry, min), max));
    // Uncontrolled mark-clicks must move the thumb: keep an internal value
    // when the consumer does not control `value` (F-dom-2, review M1).
    const [internalValue, setInternalValue] = useState<number[] | undefined>(clamp(defaultValue));
    const clampedValue = clamp(value) ?? internalValue;

    const thumbCount = useMemo(() => {
      if (Array.isArray(value)) return value.length;
      if (Array.isArray(defaultValue)) return defaultValue.length;
      return 1;
    }, [value, defaultValue]);

    // EC-1 guard: min === max would divide by zero → pin marks at 0%.
    const span = max - min || 1;
    const visibleMarks = (marks ?? []).filter((mark) => mark.value >= min && mark.value <= max);
    const isRange = thumbCount > 1;

    return (
      <div data-slot="slider" className={cn("relative w-full", visibleMarks.length > 0 && "pb-5")}>
        <SliderPrimitive.Root
          ref={ref}
          data-slot="slider-root"
          value={clampedValue}
          min={min}
          max={max}
          disabled={disabled}
          onValueChange={(next) => {
            if (value === undefined) setInternalValue(next);
            onValueChange?.(next);
          }}
          className={cn(
            "relative flex w-full touch-none select-none items-center",
            "data-[disabled]:opacity-50",
            "data-[orientation=vertical]:h-full data-[orientation=vertical]:min-h-44 data-[orientation=vertical]:w-auto data-[orientation=vertical]:flex-col",
            className,
          )}
          {...props}
        >
          <SliderPrimitive.Track
            data-slot="slider-track"
            className="relative grow overflow-hidden rounded-full bg-muted data-[orientation=horizontal]:h-1.5 data-[orientation=vertical]:h-full data-[orientation=horizontal]:w-full data-[orientation=vertical]:w-1.5"
          >
            <SliderPrimitive.Range
              data-slot="slider-range"
              className="absolute bg-primary data-[orientation=horizontal]:h-full data-[orientation=vertical]:w-full"
            />
          </SliderPrimitive.Track>
          {Array.from({ length: thumbCount }, (_, index) => (
            <SliderPrimitive.Thumb
              // biome-ignore lint/suspicious/noArrayIndexKey: thumbs are positional by design (Radix pattern)
              key={index}
              aria-label={
                isRange && ariaLabel ? `${ariaLabel} (${index + 1} of ${thumbCount})` : ariaLabel
              }
              aria-labelledby={ariaLabelledby}
              data-slot="slider-thumb"
              className="block size-4 shrink-0 rounded-full border border-primary bg-background shadow-sm transition-[box-shadow] hover:ring-4 hover:ring-ring/50 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50"
            />
          ))}
        </SliderPrimitive.Root>
        {visibleMarks.map((mark) => (
          <button
            key={mark.value}
            type="button"
            data-slot="slider-mark"
            disabled={disabled}
            tabIndex={-1}
            aria-hidden="true"
            style={{ left: `${((mark.value - min) / span) * 100}%` }}
            className="-translate-x-1/2 absolute top-4 cursor-pointer text-body-sm text-muted-foreground disabled:cursor-default"
            onClick={() => {
              if (disabled || isRange) return;
              if (value === undefined) setInternalValue([mark.value]);
              onValueChange?.([mark.value]);
            }}
          >
            {mark.label ?? mark.value}
          </button>
        ))}
      </div>
    );
  },
);
Slider.displayName = "Slider";

export { Slider };
export type { SliderMark, SliderProps };
