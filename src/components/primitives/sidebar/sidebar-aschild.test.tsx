import { render } from "@testing-library/react";
import { Home } from "lucide-react";
import { describe, expect, it } from "vitest";

import { Sidebar } from "./sidebar.js";

/**
 * usetheodev/usetheo-ui#31 — `Sidebar.Item` can render a router link.
 *
 * `as="a" href={to}` plus an `onClick` calling `navigate()` works and is what consumers write, but
 * the router never sees the link, so it cannot prefetch it. On a sidebar — where hover precedes
 * click almost every time — that is exactly where prefetch paid. Wrapping in a `<Link>` instead
 * nests an `<a>` inside an `<a>`.
 *
 * What matters is not that a child renders. It is that the child becomes the HOST element and the
 * component's own parts — icon, count, `aria-current` — survive around it. A `Slot` without
 * `Slottable` would style the link and silently drop everything else.
 */

/** A stand-in for a router `Link`: it forwards nothing itself, so anything reaching the DOM had to
 *  be merged in by `Slot`. */
function FakeLink({ to, children, ...rest }: { to: string; children: React.ReactNode }) {
  return (
    <a href={to} data-router-link="true" {...rest}>
      {children}
    </a>
  );
}

describe("#31 — Sidebar.Item asChild", () => {
  it("test_the_child_becomes_the_rendered_element", () => {
    const { container } = render(
      <Sidebar.Item asChild>
        <FakeLink to="/feedback">Feedback</FakeLink>
      </Sidebar.Item>,
    );
    const anchor = container.querySelector("a");
    expect(anchor).not.toBeNull();
    // The router's own element, not one the sidebar built for it.
    expect(anchor?.getAttribute("data-router-link")).toBe("true");
    expect(anchor?.getAttribute("href")).toBe("/feedback");
    // And no `<button>` was rendered alongside it.
    expect(container.querySelector("button")).toBeNull();
  });

  it("test_the_component_styles_land_on_the_child", () => {
    const { container } = render(
      <Sidebar.Item asChild>
        <FakeLink to="/x">X</FakeLink>
      </Sidebar.Item>,
    );
    const anchor = container.querySelector("a");
    expect(anchor?.getAttribute("data-slot")).toBe("sidebar-item");
    // One representative class from each thing the row promises: layout and the focus ring.
    expect(anchor?.className).toContain("rounded-lg");
    expect(anchor?.className).toContain("focus-visible:ring-2");
  });

  it("test_the_icon_and_the_count_survive_the_slot", () => {
    // The reason `Slottable` is there. A plain `<Slot>` replaces the whole subtree with the child,
    // so both would vanish while every other assertion above still passed.
    const { container } = render(
      <Sidebar.Item asChild icon={Home} count={7}>
        <FakeLink to="/inbox">Inbox</FakeLink>
      </Sidebar.Item>,
    );
    const anchor = container.querySelector("a");
    expect(anchor?.querySelector("svg")).not.toBeNull();
    expect(anchor?.textContent).toContain("7");
    // The child's own text is still there — it was not replaced by the wrapper's parts.
    expect(anchor?.textContent).toContain("Inbox");
  });

  it("test_active_puts_aria_current_on_the_child", () => {
    // `aria-current="page"` is the component's job in the anchor arm too; a router link that
    // dropped it would be styled as active and announced as ordinary.
    const { container } = render(
      <Sidebar.Item asChild active>
        <FakeLink to="/now">Now</FakeLink>
      </Sidebar.Item>,
    );
    expect(container.querySelector("a")?.getAttribute("aria-current")).toBe("page");
  });

  it("test_inactive_leaves_aria_current_off_rather_than_false", () => {
    const { container } = render(
      <Sidebar.Item asChild>
        <FakeLink to="/other">Other</FakeLink>
      </Sidebar.Item>,
    );
    expect(container.querySelector("a")?.hasAttribute("aria-current")).toBe(false);
  });

  it("test_the_default_arms_are_unchanged", () => {
    // Back-compat: `asChild` is additive, and the two existing arms must render exactly as before.
    const { container: buttonTree } = render(<Sidebar.Item>Plain</Sidebar.Item>);
    expect(buttonTree.querySelector("button")?.getAttribute("type")).toBe("button");

    const { container: anchorTree } = render(
      <Sidebar.Item as="a" href="/docs">
        Docs
      </Sidebar.Item>,
    );
    const anchor = anchorTree.querySelector("a");
    expect(anchor?.getAttribute("href")).toBe("/docs");
    expect(anchor?.getAttribute("data-router-link")).toBeNull();
  });

  it("test_asChild_does_not_leak_onto_the_dom", () => {
    // React warns about unknown DOM attributes, and a leaked `asChild` would ship as one.
    const { container } = render(
      <Sidebar.Item asChild>
        <FakeLink to="/y">Y</FakeLink>
      </Sidebar.Item>,
    );
    expect(container.querySelector("a")?.hasAttribute("aschild")).toBe(false);
  });
});
