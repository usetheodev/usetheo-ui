import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { ActionBar } from "./action-bar.js";

describe("ActionBar", () => {
  it("renders nothing when no props provided", () => {
    const { container } = render(<ActionBar />);
    expect(container.firstChild).toBeNull();
  });

  it("search fires onChange on input", () => {
    const onChange = vi.fn();
    render(<ActionBar search={{ placeholder: "Search…", value: "", onChange }} />);
    const input = screen.getByPlaceholderText("Search…") as HTMLInputElement;
    fireEvent.change(input, { target: { value: "hello" } });
    expect(onChange).toHaveBeenCalledWith("hello");
  });

  it("primary action fires onClick", () => {
    const onClick = vi.fn();
    render(<ActionBar primaryAction={{ label: "New", onClick }} />);
    fireEvent.click(screen.getByRole("button", { name: "New" }));
    expect(onClick).toHaveBeenCalled();
  });

  it("filter button fires onFilterClick", () => {
    const onFilterClick = vi.fn();
    render(<ActionBar onFilterClick={onFilterClick} />);
    fireEvent.click(screen.getByRole("button", { name: "Filter" }));
    expect(onFilterClick).toHaveBeenCalled();
  });

  // EC-6: primaryAction.loading disables button + shows spinner
  it("primary action loading disables and shows spinner", () => {
    const onClick = vi.fn();
    const { container } = render(
      <ActionBar primaryAction={{ label: "Save", onClick, loading: true }} />,
    );
    const button = screen.getByRole("button", { name: /Save/ });
    expect(button).toBeDisabled();
    expect(container.innerHTML).toContain("animate-spin");
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("has no axe violations (full featured)", async () => {
    const { container } = render(
      <ActionBar
        search={{ placeholder: "Search…", value: "", onChange: () => undefined }}
        primaryAction={{ label: "New", onClick: () => undefined }}
        onFilterClick={() => undefined}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("ActionBar — search a11y (issue #8 regression)", () => {
  it("test_search_input_aria_label_derived_from_placeholder", () => {
    const { getByLabelText } = render(
      <ActionBar search={{ placeholder: "Search projects...", value: "", onChange: () => {} }} />,
    );
    // deriva do placeholder com reticências (ASCII e Unicode) removidas
    expect(getByLabelText("Search projects")).toBeTruthy();
  });

  it("test_search_input_explicit_aria_label_wins", () => {
    const { getByLabelText } = render(
      <ActionBar
        search={{
          placeholder: "Search…",
          "aria-label": "Search the project list",
          value: "",
          onChange: () => {},
        }}
      />,
    );
    expect(getByLabelText("Search the project list")).toBeTruthy();
  });
});
