import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { JsonViewer as JsonViewerFromBarrel } from "../../../index.js";
import type { JsonViewerProps } from "./json-viewer.js";
import { JsonViewer } from "./json-viewer.js";
import { DetailPanel, EventPayload } from "./json-viewer.stories.js";

function renderJson(value: unknown, props: Partial<JsonViewerProps> = {}) {
  return render(<JsonViewer value={value} {...props} />);
}

const toggles = (container: HTMLElement) =>
  container.querySelectorAll('[data-slot="json-viewer-toggle"]');

describe("JsonViewer — types", () => {
  it.each([
    ["string", { s: "hello" }, '"hello"'],
    ["number", { n: 42 }, "42"],
    ["boolean", { b: true }, "true"],
    ["null", { z: null }, "null"],
  ])("renders %s values literally", (_kind, value, expected) => {
    renderJson(value);
    expect(screen.getByText(expected)).toBeInTheDocument();
  });

  it("renders BigInt with the n suffix", () => {
    renderJson({ big: BigInt(10) });
    expect(screen.getByText("10n")).toBeInTheDocument();
  });

  it("renders undefined and functions without crash", () => {
    renderJson({ u: undefined, f: () => 1 });
    expect(screen.getByText("undefined")).toBeInTheDocument();
    expect(screen.getByText("ƒ")).toBeInTheDocument();
  });

  it("renders a fixed Date deterministically as its ISO string (EC-1)", () => {
    renderJson({ at: new Date("2026-01-02T03:04:05.000Z") });
    expect(screen.getByText(/2026-01-02T03:04:05/)).toBeInTheDocument();
  });
});

describe("JsonViewer — collapse", () => {
  const nested = { level1: { level2: { leaf: "deep" } } };

  it("collapsed=true hides children (lazy — not in the DOM)", () => {
    renderJson(nested, { collapsed: true });
    expect(screen.queryByText("level1")).toBeNull();
  });

  it("collapsed as number expands only above that depth", () => {
    renderJson(nested, { collapsed: 1 });
    expect(screen.getByText("level1")).toBeInTheDocument();
    expect(screen.queryByText("level2")).toBeNull();
  });

  it("toggle click expands and collapses with aria-expanded", async () => {
    const user = userEvent.setup();
    const { container } = renderJson(nested, { collapsed: 1 });
    const toggle = toggles(container)[1] ?? toggles(container)[0];
    if (!toggle) throw new Error("toggle missing");
    await user.click(toggle);
    expect(screen.getByText("level2")).toBeInTheDocument();
    await user.click(toggle);
    expect(screen.queryByText("level2")).toBeNull();
  });
});

describe("JsonViewer — strings & edges", () => {
  it("truncates long strings and expands on click", async () => {
    const user = userEvent.setup();
    const long = "x".repeat(100);
    renderJson({ long }, { shortenTextAfterLength: 60 });
    expect(screen.queryByText(`"${long}"`)).toBeNull();
    const truncated = screen.getByText(/x{10,}…/);
    await user.click(truncated);
    expect(screen.getByText(`"${long}"`)).toBeInTheDocument();
  });

  it("empty object and array are leaves without toggle (edge)", () => {
    const { container } = renderJson({ o: {}, a: [] });
    expect(screen.getByText("{}")).toBeInTheDocument();
    expect(screen.getByText("[]")).toBeInTheDocument();
    expect(toggles(container)).toHaveLength(1);
  });

  it("primitive root renders (edge)", () => {
    renderJson(42);
    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("keys containing the path delimiter do not collide (edge)", async () => {
    const user = userEvent.setup();
    const { container } = renderJson({ "a.b": { x: 1 }, a: { b: { y: 2 } } }, { collapsed: 1 });
    const all = toggles(container);
    await user.click(all[1] as Element);
    expect(screen.getByText("x")).toBeInTheDocument();
    expect(screen.queryByText("y")).toBeNull();
  });

  it("empty-string key renders without colliding with the root (EC-2 edge)", () => {
    renderJson({ "": 1 });
    expect(screen.getByText('""')).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
  });
});

describe("JsonViewer — circular & copy (negatives)", () => {
  it("circular reference renders the [Circular] marker without stack overflow", () => {
    const obj: Record<string, unknown> = { name: "root" };
    obj.self = obj;
    renderJson(obj);
    expect(screen.getByText("[Circular]")).toBeInTheDocument();
  });

  it("copying a circular subtree writes safe JSON to the clipboard", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    const obj: Record<string, unknown> = { name: "root" };
    obj.self = obj;
    const { container } = renderJson(obj, { enableCopy: true });
    const copy = container.querySelector('[data-slot="json-viewer-copy"] button');
    if (!copy) throw new Error("copy button missing");
    expect(copy).toHaveAttribute("aria-label", expect.stringContaining("Copy"));
    await user.click(copy);
    expect(writeText).toHaveBeenCalledTimes(1);
    const written = writeText.mock.calls[0]?.[0] as string;
    expect(written).toContain('"[Circular]"');
    expect(() => JSON.parse(written)).not.toThrow();
  });
});

describe("JsonViewer — wiring & a11y", () => {
  it("all parts carry data-slot attributes", () => {
    const { container } = renderJson({ a: { b: 1 } }, { enableCopy: true });
    for (const slot of [
      "json-viewer",
      "json-viewer-node",
      "json-viewer-toggle",
      "json-viewer-key",
      "json-viewer-value",
      "json-viewer-copy",
    ]) {
      expect(container.querySelector(`[data-slot="${slot}"]`)).not.toBeNull();
    }
  });

  it("axe: no violations on an expanded tree with all types", async () => {
    const { container } = renderJson({
      s: "text",
      n: 1,
      b: false,
      z: null,
      arr: [1, 2],
      obj: { nested: true },
    });
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("JsonViewer — stories (M2 consumer evidence)", () => {
  it("event payload story renders the typed-event fixture", () => {
    render(<EventPayload />);
    expect(screen.getByText("type")).toBeInTheDocument();
    expect(screen.getByText('"tool.call"')).toBeInTheDocument();
  });

  it("detail panel composition (DL + JsonViewer) has no axe violations", async () => {
    const { container } = render(<DetailPanel />);
    expect(container.querySelector("dl")).not.toBeNull();
    expect(container.querySelector('[data-slot="json-viewer"]')).not.toBeNull();
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("JsonViewer — barrel", () => {
  it("barrel exports the same symbol", () => {
    expect(JsonViewerFromBarrel).toBe(JsonViewer);
  });
});
