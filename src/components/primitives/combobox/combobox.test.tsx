import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { Combobox as ComboboxFromBarrel } from "../../../index.js";
import type { ComboboxProps } from "./combobox.js";
import { Combobox } from "./combobox.js";
import { Basic as BasicStory, QueryPlayground } from "./combobox.stories.js";

const FRUITS = ["Apple", "Banana", "Cherry"];

function renderCombobox(props: Partial<ComboboxProps> = {}, items: string[] = FRUITS) {
  return render(
    <Combobox {...props}>
      <Combobox.Input placeholder="Pick a fruit" />
      <Combobox.Content>
        <Combobox.Empty>No results.</Combobox.Empty>
        {items.map((item) => (
          <Combobox.Item key={item} value={item}>
            {item}
          </Combobox.Item>
        ))}
      </Combobox.Content>
    </Combobox>,
  );
}

const input = () => screen.getByPlaceholderText("Pick a fruit");
const contentOf = (container: HTMLElement) =>
  container.querySelector('[data-slot="combobox-content"]');

describe("Combobox — open/close contract", () => {
  it("closed by default: aria-expanded false, no aria-controls, no content", () => {
    const { container } = renderCombobox();
    expect(input()).toHaveAttribute("aria-expanded", "false");
    expect(input()).not.toHaveAttribute("aria-controls");
    expect(contentOf(container)).toBeNull();
  });

  it("opens on focus and wires aria-expanded + aria-controls to the content", async () => {
    const user = userEvent.setup();
    const { container } = renderCombobox();
    await user.click(input());
    const content = contentOf(container);
    expect(content).not.toBeNull();
    expect(input()).toHaveAttribute("aria-expanded", "true");
    expect(input()).toHaveAttribute("aria-controls", content?.id);
  });

  it("escape closes the listbox and keeps focus on the input", async () => {
    const user = userEvent.setup();
    const { container } = renderCombobox();
    await user.click(input());
    await user.keyboard("{Escape}");
    expect(contentOf(container)).toBeNull();
    expect(input()).toHaveFocus();
  });

  it("mousedown outside closes the listbox", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <div>
        <button type="button">outside</button>
        <Combobox>
          <Combobox.Input placeholder="Pick a fruit" />
          <Combobox.Content>
            <Combobox.Item value="Apple">Apple</Combobox.Item>
          </Combobox.Content>
        </Combobox>
      </div>,
    );
    await user.click(input());
    expect(contentOf(container)).not.toBeNull();
    await user.click(screen.getByText("outside"));
    expect(contentOf(container)).toBeNull();
  });

  it("unmount while open removes the document mousedown listener (EC-4)", async () => {
    const user = userEvent.setup();
    const removeSpy = vi.spyOn(document, "removeEventListener");
    const { unmount } = renderCombobox();
    await user.click(input());
    unmount();
    expect(removeSpy.mock.calls.some(([type]) => type === "mousedown")).toBe(true);
    removeSpy.mockRestore();
  });
});

describe("Combobox — filtering & selection", () => {
  it("typing filters items via cmdk", async () => {
    const user = userEvent.setup();
    renderCombobox();
    await user.click(input());
    await user.keyboard("Ban");
    expect(screen.getByText("Banana")).toBeInTheDocument();
    expect(screen.queryByText("Apple")).toBeNull();
  });

  it("no match shows the empty state", async () => {
    const user = userEvent.setup();
    const { container } = renderCombobox();
    await user.click(input());
    await user.keyboard("zzz");
    expect(container.querySelector('[data-slot="combobox-empty"]')).not.toBeNull();
  });

  it("click on an item sets value and closes", async () => {
    const user = userEvent.setup();
    const spy = vi.fn();
    const { container } = renderCombobox({ onValueChange: spy });
    await user.click(input());
    await user.click(screen.getByText("Banana"));
    expect(spy).toHaveBeenCalledWith("Banana");
    expect(contentOf(container)).toBeNull();
  });

  it("keyboard ArrowDown + Enter selects the highlighted item", async () => {
    const user = userEvent.setup();
    const spy = vi.fn();
    renderCombobox({ onValueChange: spy });
    await user.click(input());
    await user.keyboard("{ArrowDown}{Enter}");
    expect(spy).toHaveBeenCalledTimes(1);
    expect(FRUITS).toContain(spy.mock.calls[0]?.[0]);
  });

  it("controlled value marks the selected item", async () => {
    const user = userEvent.setup();
    renderCombobox({ value: "Cherry" });
    await user.click(input());
    const cherry = screen.getByText("Cherry").closest('[data-slot="combobox-item"]');
    expect(cherry).toHaveAttribute("data-selected-value", "true");
  });

  it("selecting a stale item is a no-op (negative)", async () => {
    const user = userEvent.setup();
    const spy = vi.fn();
    const view = render(
      <Combobox onValueChange={spy}>
        <Combobox.Input placeholder="Pick a fruit" />
        <Combobox.Content>
          <Combobox.Item value="Ghost">Ghost</Combobox.Item>
        </Combobox.Content>
      </Combobox>,
    );
    await user.click(screen.getByPlaceholderText("Pick a fruit"));
    await user.keyboard("{ArrowDown}");
    view.rerender(
      <Combobox onValueChange={spy}>
        <Combobox.Input placeholder="Pick a fruit" />
        <Combobox.Content>
          <Combobox.Item value="Other">Other</Combobox.Item>
        </Combobox.Content>
      </Combobox>,
    );
    await user.keyboard("{Enter}");
    expect(spy).not.toHaveBeenCalledWith("Ghost");
  });
});

function renderLoading(children?: ReactNode) {
  return render(
    <Combobox>
      <Combobox.Input placeholder="Pick a fruit" />
      <Combobox.Content loading>{children}</Combobox.Content>
    </Combobox>,
  );
}

describe("Combobox — async & loading", () => {
  it("shouldFilter=false leaves filtering to the consumer", async () => {
    const user = userEvent.setup();
    renderCombobox({ shouldFilter: false });
    await user.click(input());
    await user.keyboard("zzz");
    expect(screen.getByText("Apple")).toBeInTheDocument();
    expect(screen.getByText("Cherry")).toBeInTheDocument();
  });

  it("loading shows the loading slot with aria-busy and hides items", async () => {
    const user = userEvent.setup();
    const { container } = renderLoading(
      <>
        <Combobox.Empty>No results.</Combobox.Empty>
        <Combobox.Item value="Apple">Apple</Combobox.Item>
      </>,
    );
    await user.click(input());
    const loading = container.querySelector('[data-slot="combobox-loading"]');
    expect(loading).not.toBeNull();
    expect(loading).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByText("Apple")).toBeNull();
  });

  it("loading suppresses the empty state (EC-3)", async () => {
    const user = userEvent.setup();
    const { container } = renderLoading(<Combobox.Empty>No results.</Combobox.Empty>);
    await user.click(input());
    expect(container.querySelector('[data-slot="combobox-loading"]')).not.toBeNull();
    expect(container.querySelector('[data-slot="combobox-empty"]')).toBeNull();
  });
});

describe("Combobox — wiring & a11y", () => {
  it("all subs carry data-slot attributes", async () => {
    const user = userEvent.setup();
    const { container } = renderCombobox();
    await user.click(input());
    for (const slot of ["combobox", "combobox-input", "combobox-content", "combobox-item"]) {
      expect(container.querySelector(`[data-slot="${slot}"]`)).not.toBeNull();
    }
    // Empty only mounts on no-match (cmdk behavior) — provoke it.
    await user.keyboard("zzz");
    expect(container.querySelector('[data-slot="combobox-empty"]')).not.toBeNull();
    const loadingView = render(
      <Combobox defaultOpen>
        <Combobox.Input placeholder="loading probe" />
        <Combobox.Content loading />
      </Combobox>,
    );
    expect(loadingView.container.querySelector('[data-slot="combobox-loading"]')).not.toBeNull();
  });

  it("root and input forward refs", () => {
    const rootRef = createRef<HTMLDivElement>();
    const inputRef = createRef<HTMLInputElement>();
    render(
      <Combobox ref={rootRef}>
        <Combobox.Input ref={inputRef} placeholder="Pick a fruit" />
        <Combobox.Content>
          <Combobox.Item value="Apple">Apple</Combobox.Item>
        </Combobox.Content>
      </Combobox>,
    );
    expect(rootRef.current).toBeInstanceOf(HTMLDivElement);
    expect(inputRef.current).toBeInstanceOf(HTMLInputElement);
  });

  it("axe: no violations with the listbox open", async () => {
    const user = userEvent.setup();
    const { container } = renderCombobox({ "aria-label": "Fruit picker" });
    await user.click(input());
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Combobox — story smoke", () => {
  it("basic story renders the labelled input", () => {
    render(<BasicStory />);
    expect(screen.getByPlaceholderText("Select a collection")).toBeInTheDocument();
  });
});

describe("Combobox — barrel", () => {
  it("barrel exports the same symbol", () => {
    expect(ComboboxFromBarrel).toBe(Combobox);
  });
});

describe("Query playground composition (M1 DoD bullet 3)", () => {
  it("renders two sliders + combobox with zero axe violations", async () => {
    const { container } = render(<QueryPlayground />);
    expect(screen.getAllByRole("slider")).toHaveLength(2);
    expect(screen.getByPlaceholderText("Select a collection")).toBeInTheDocument();
    expect(await axe(container)).toHaveNoViolations();
  });
});
