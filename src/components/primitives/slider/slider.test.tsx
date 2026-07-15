import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Slider as SliderFromBarrel } from "../../../index.js";
import { Slider } from "./slider.js";
import { Default as DefaultStory } from "./slider.stories.js";

const marks = (...values: number[]) => values.map((value) => ({ value, label: String(value) }));

function thumbs(container: HTMLElement) {
  return container.querySelectorAll('[data-slot="slider-thumb"]');
}

function markSlots(container: HTMLElement) {
  return container.querySelectorAll('[data-slot="slider-mark"]');
}

describe("Slider — rendering", () => {
  it("renders a single-thumb slider", () => {
    const { container } = render(<Slider aria-label="Top K" defaultValue={[5]} />);
    expect(screen.getByRole("slider")).toBeInTheDocument();
    expect(thumbs(container)).toHaveLength(1);
  });

  it("renders a range with two thumbs", () => {
    const { container } = render(<Slider aria-label="Range" defaultValue={[20, 80]} />);
    expect(thumbs(container)).toHaveLength(2);
  });

  it("all parts carry data-slot attributes", () => {
    const { container } = render(
      <Slider aria-label="Slotted" defaultValue={[50]} marks={marks(0, 50, 100)} />,
    );
    for (const slot of ["slider", "slider-track", "slider-range", "slider-thumb", "slider-mark"]) {
      expect(container.querySelector(`[data-slot="${slot}"]`)).not.toBeNull();
    }
  });
});

describe("Slider — value semantics", () => {
  it("arrow keys change the value by one step", async () => {
    const user = userEvent.setup();
    const spy = vi.fn();
    render(<Slider aria-label="Kb" defaultValue={[50]} onValueChange={spy} />);
    screen.getByRole("slider").focus();
    await user.keyboard("{ArrowRight}");
    expect(spy).toHaveBeenLastCalledWith([51]);
    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(spy).toHaveBeenLastCalledWith([49]);
  });

  it("step is respected on keyboard", async () => {
    const user = userEvent.setup();
    const spy = vi.fn();
    render(<Slider aria-label="Step" step={10} defaultValue={[50]} onValueChange={spy} />);
    screen.getByRole("slider").focus();
    await user.keyboard("{ArrowRight}");
    expect(spy).toHaveBeenLastCalledWith([60]);
  });

  it("decimal step is supported", async () => {
    const user = userEvent.setup();
    const spy = vi.fn();
    render(
      <Slider
        aria-label="Threshold"
        min={0}
        max={1}
        step={0.05}
        defaultValue={[0.5]}
        onValueChange={spy}
      />,
    );
    screen.getByRole("slider").focus();
    await user.keyboard("{ArrowRight}");
    expect(spy).toHaveBeenLastCalledWith([0.55]);
  });

  it("value is clamped to max", () => {
    render(<Slider aria-label="Max" max={100} defaultValue={[150]} />);
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "100");
  });

  it("value is clamped to min", () => {
    render(<Slider aria-label="Min" min={10} defaultValue={[0]} />);
    expect(screen.getByRole("slider")).toHaveAttribute("aria-valuenow", "10");
  });

  it("exposes aria value attributes and label", () => {
    render(<Slider aria-label="Top K" min={1} max={100} defaultValue={[5]} />);
    const slider = screen.getByRole("slider");
    expect(slider).toHaveAttribute("aria-valuemin", "1");
    expect(slider).toHaveAttribute("aria-valuemax", "100");
    expect(slider).toHaveAttribute("aria-valuenow", "5");
  });
});

describe("Slider — marks", () => {
  it("renders marks at percent positions", () => {
    const { container } = render(
      <Slider aria-label="Marked" defaultValue={[50]} marks={marks(0, 50, 100)} />,
    );
    const slots = markSlots(container);
    expect(slots).toHaveLength(3);
    const lefts = [...slots].map((m) => (m as HTMLElement).style.left);
    expect(lefts).toEqual(["0%", "50%", "100%"]);
  });

  it("mark click sets the value in single mode", async () => {
    const user = userEvent.setup();
    const spy = vi.fn();
    const { container } = render(
      <Slider aria-label="Clickable" defaultValue={[10]} marks={marks(50)} onValueChange={spy} />,
    );
    await user.click(markSlots(container)[0] as HTMLElement);
    expect(spy).toHaveBeenLastCalledWith([50]);
  });

  it("marks outside the range are not rendered", () => {
    const { container } = render(
      <Slider aria-label="Bounded" max={100} defaultValue={[10]} marks={marks(50, 150)} />,
    );
    expect(markSlots(container)).toHaveLength(1);
  });

  it("marks render at zero percent when min equals max", () => {
    const { container } = render(
      <Slider aria-label="Degenerate" min={10} max={10} defaultValue={[10]} marks={marks(10)} />,
    );
    const mark = markSlots(container)[0] as HTMLElement;
    expect(mark.style.left).toBe("0%");
  });

  it("mark click is ignored when disabled", async () => {
    const user = userEvent.setup();
    const spy = vi.fn();
    const { container } = render(
      <Slider
        aria-label="Off"
        disabled
        defaultValue={[10]}
        marks={marks(50)}
        onValueChange={spy}
      />,
    );
    await user.click(markSlots(container)[0] as HTMLElement);
    expect(spy).not.toHaveBeenCalled();
  });
});

describe("Slider — a11y", () => {
  it("axe: no violations on single, range and marked sliders", async () => {
    const { container } = render(
      <div>
        <Slider aria-label="Single" defaultValue={[30]} />
        <Slider aria-label="Range" defaultValue={[20, 80]} />
        <Slider aria-label="Marked" defaultValue={[50]} marks={marks(0, 50, 100)} />
      </div>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Slider — story smoke", () => {
  it("default story renders a labelled slider", () => {
    render(<DefaultStory />);
    expect(screen.getByRole("slider")).toHaveAttribute("aria-label", "Volume");
  });
});

describe("Slider — barrel", () => {
  it("barrel exports the same symbol", () => {
    expect(SliderFromBarrel).toBe(Slider);
  });
});
