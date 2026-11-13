import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Card } from "./card.js";

/**
 * usetheodev/usetheo-ui#32 — the whole card can be a control.
 *
 * Choice grids, plan pickers and agent selectors all want a clickable card, and both ways to build
 * one without this were bad: a `<button>` wrapped AROUND a `<Card>` is invalid markup (a button
 * takes phrasing content; the card renders a `<div>`, so the browser reparents it), and copying
 * the card's classes onto a `<button>` forks the design system at a place that stops tracking it.
 *
 * `Card.Title` already had exactly this hatch for swapping its `<h3>`. Answering the root
 * differently from the title would have been worse than either answer on its own.
 */

describe("#32 — Card asChild", () => {
  it("test_the_child_becomes_the_rendered_element", () => {
    const { container } = render(
      <Card asChild>
        <button type="button">Pick this plan</button>
      </Card>,
    );
    const button = container.querySelector("button");
    expect(button).not.toBeNull();
    expect(button?.getAttribute("type")).toBe("button");
    // No wrapper div left behind — the point is ONE element, not a button inside a div.
    expect(container.firstElementChild?.tagName).toBe("BUTTON");
  });

  it("test_the_card_styles_land_on_the_child", () => {
    const { container } = render(
      <Card asChild>
        <button type="button">Pick</button>
      </Card>,
    );
    const button = container.querySelector("button");
    expect(button?.getAttribute("data-slot")).toBe("card");
    // The surface the issue names as the thing consumers hand-copy today.
    expect(button?.className).toContain("rounded-xl");
    expect(button?.className).toContain("border-border");
    expect(button?.className).toContain("bg-card");
  });

  it("test_the_control_keeps_its_own_semantics", () => {
    // The whole reason to reach for this: `aria-pressed` on a card-shaped toggle.
    const { container } = render(
      <Card asChild size="sm">
        <button type="button" aria-pressed="true">
          Selected agent
        </button>
      </Card>,
    );
    expect(container.querySelector("button")?.getAttribute("aria-pressed")).toBe("true");
  });

  it("test_size_still_reaches_the_subcomponents_through_the_context", () => {
    // `size` is delivered by context, and the provider now wraps a `Slot` rather than a `div`.
    // If that rewiring had broken, the title would silently fall back to the `md` font scale.
    const { container: small } = render(
      <Card asChild size="sm">
        <button type="button">
          <Card.Title>Title</Card.Title>
        </button>
      </Card>,
    );
    const { container: large } = render(
      <Card asChild size="lg">
        <button type="button">
          <Card.Title>Title</Card.Title>
        </button>
      </Card>,
    );
    const smallTitle = small.querySelector('[data-slot="card-title"]')?.className ?? "";
    const largeTitle = large.querySelector('[data-slot="card-title"]')?.className ?? "";
    expect(smallTitle).not.toBe(largeTitle);
  });

  it("test_an_anchor_child_works_too", () => {
    // The navigable case, where the phrasing-content restriction does not apply — the issue calls
    // this out as the better answer whenever the card is a link rather than a control.
    const { container } = render(
      <Card asChild>
        <a href="/agents/42">
          <Card.Title>Agent 42</Card.Title>
        </a>
      </Card>,
    );
    const anchor = container.querySelector("a");
    expect(anchor?.getAttribute("href")).toBe("/agents/42");
    expect(anchor?.querySelector("h3")).not.toBeNull();
  });

  it("test_the_default_still_renders_a_div", () => {
    // Back-compat: `asChild` is additive and defaults to false.
    const { container } = render(<Card>Plain</Card>);
    expect(container.firstElementChild?.tagName).toBe("DIV");
    expect(container.querySelector('[data-slot="card"]')).not.toBeNull();
  });

  it("test_asChild_does_not_leak_onto_the_dom", () => {
    const { container } = render(
      <Card asChild>
        <button type="button">X</button>
      </Card>,
    );
    expect(container.querySelector("button")?.hasAttribute("aschild")).toBe(false);
  });
});
