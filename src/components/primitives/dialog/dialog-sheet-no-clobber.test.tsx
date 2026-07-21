import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

// Import BOTH from the package barrel (not the local module) so this test exercises
// the real module-evaluation order — the exact condition under which Sheet.Content
// used to clobber Dialog.Content (both mutated the shared DialogPrimitive.Root).
import { Dialog, Sheet } from "../../../index.js";

describe("Dialog / Sheet no-clobber regression", () => {
  it("Dialog and Sheet are distinct objects (compound members do not collide)", () => {
    // The bug: both were `DialogPrimitive.Root`, so Dialog.Content === Sheet.Content.
    expect(Dialog).not.toBe(Sheet);
    expect(Dialog.Content).not.toBe(Sheet.Content);
    expect(Dialog.Header).not.toBe(Sheet.Header);
  });

  it("Dialog.Content renders CENTERED (not a lateral drawer)", () => {
    render(
      <Dialog open>
        <Dialog.Content data-testid="dlg">
          <Dialog.Title>Centered</Dialog.Title>
        </Dialog.Content>
      </Dialog>,
    );
    const content = screen.getByTestId("dlg");
    // Centered modal: translated to the middle of the viewport.
    expect(content.className).toContain("left-1/2");
    expect(content.className).toContain("top-1/2");
    // And NOT anchored to an edge / sliding in from a side.
    expect(content.className).not.toContain("slide-in-from-right");
    expect(content.className).not.toContain("right-0");
  });

  it("Sheet.Content renders LATERAL (right edge) — still works after the fix", () => {
    render(
      <Sheet open>
        <Sheet.Content data-testid="sht">
          <Sheet.Title>Lateral</Sheet.Title>
        </Sheet.Content>
      </Sheet>,
    );
    const content = screen.getByTestId("sht");
    expect(content.className).toContain("right-0");
    expect(content.className).toContain("slide-in-from-right");
    // And NOT centered.
    expect(content.className).not.toContain("left-1/2");
  });
});
