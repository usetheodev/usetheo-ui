import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { Breadcrumb as BreadcrumbFromBarrel } from "../../../index.js";
import { Breadcrumb } from "./breadcrumb.js";
import { Default as DefaultStory } from "./breadcrumb.stories.js";

/** Renders children inside the canonical nav>ol shell. */
function renderTrail(children?: ReactNode) {
  return render(
    <Breadcrumb>
      <Breadcrumb.List>{children}</Breadcrumb.List>
    </Breadcrumb>,
  );
}

const linkItem = (label: string, href?: string) => (
  <Breadcrumb.Item key={label}>
    <Breadcrumb.Link href={href}>{label}</Breadcrumb.Link>
  </Breadcrumb.Item>
);

const pageItem = (label: string) => (
  <Breadcrumb.Item key={label}>
    <Breadcrumb.Page>{label}</Breadcrumb.Page>
  </Breadcrumb.Item>
);

const separator = (key: string, children?: ReactNode) => (
  <Breadcrumb.Separator key={key}>{children}</Breadcrumb.Separator>
);

const threeLevelTrail = [
  linkItem("Home", "/"),
  separator("s1"),
  linkItem("Components", "/components"),
  separator("s2"),
  pageItem("Breadcrumb"),
];

describe("Breadcrumb — rendering", () => {
  it("renders nav with aria-label breadcrumb", () => {
    renderTrail(threeLevelTrail);
    expect(screen.getByRole("navigation")).toHaveAttribute("aria-label", "breadcrumb");
  });

  it("three items render two separators", () => {
    const { container } = renderTrail(threeLevelTrail);
    expect(container.querySelectorAll('[data-slot="breadcrumb-separator"]')).toHaveLength(2);
    expect(container.querySelectorAll('[data-slot="breadcrumb-item"]')).toHaveLength(3);
  });

  it("custom separator children rendered", () => {
    renderTrail([linkItem("Home", "/"), separator("s1", "·"), pageItem("Here")]);
    expect(screen.getAllByText("·")).toHaveLength(1);
  });

  it("page has aria-current and is not a link", () => {
    renderTrail(threeLevelTrail);
    const page = screen.getByText("Breadcrumb");
    expect(page).toHaveAttribute("aria-current", "page");
    expect(page).not.toHaveAttribute("href");
  });

  it("separator hidden from screen readers", () => {
    const { container } = renderTrail(threeLevelTrail);
    for (const sep of container.querySelectorAll('[data-slot="breadcrumb-separator"]')) {
      expect(sep).toHaveAttribute("aria-hidden", "true");
      expect(sep).toHaveAttribute("role", "presentation");
    }
  });

  it("single item renders no separator", () => {
    const { container } = renderTrail(pageItem("Only"));
    expect(container.querySelectorAll('[data-slot="breadcrumb-separator"]')).toHaveLength(0);
  });

  it("empty list renders valid ol without crash", () => {
    const { container } = renderTrail();
    const list = container.querySelector("ol");
    expect(list).not.toBeNull();
    expect(list?.childElementCount).toBe(0);
  });
});

describe("Breadcrumb — link boundaries", () => {
  it("asChild preserves child props and classes", () => {
    renderTrail(
      <Breadcrumb.Item>
        <Breadcrumb.Link asChild className="from-lib">
          <a href="/spa" data-router-link="true" className="from-consumer">
            Spa
          </a>
        </Breadcrumb.Link>
      </Breadcrumb.Item>,
    );
    const link = screen.getByRole("link", { name: "Spa" });
    expect(link).toHaveAttribute("data-router-link", "true");
    expect(link).toHaveAttribute("href", "/spa");
    expect(link.className).toContain("from-consumer");
    expect(link.className).toContain("from-lib");
  });

  it("blocks javascript: href (safeHref)", () => {
    renderTrail(linkItem("Evil", "javascript:alert(1)"));
    expect(screen.getByText("Evil")).not.toHaveAttribute("href");
  });

  it("renders without href attribute when href is undefined or empty", () => {
    renderTrail([linkItem("NoHref"), separator("s1"), linkItem("Empty", "")]);
    expect(screen.getByText("NoHref")).not.toHaveAttribute("href");
    expect(screen.getByText("Empty")).not.toHaveAttribute("href");
  });
});

describe("Breadcrumb — wiring conventions", () => {
  const ellipsisTrail = [
    linkItem("Home", "/"),
    separator("s1"),
    <Breadcrumb.Item key="ellipsis">
      <Breadcrumb.Ellipsis />
    </Breadcrumb.Item>,
    separator("s2"),
    linkItem("Docs", "/docs"),
    separator("s3"),
    pageItem("Breadcrumb"),
  ];

  it("all subs carry data-slot attributes", () => {
    const { container } = renderTrail(ellipsisTrail);
    for (const slot of [
      "breadcrumb",
      "breadcrumb-list",
      "breadcrumb-item",
      "breadcrumb-link",
      "breadcrumb-page",
      "breadcrumb-separator",
      "breadcrumb-ellipsis",
    ]) {
      expect(container.querySelector(`[data-slot="${slot}"]`)).not.toBeNull();
    }
  });

  it("root and link forward refs", () => {
    const navRef = createRef<HTMLElement>();
    const linkRef = createRef<HTMLAnchorElement>();
    render(
      <Breadcrumb ref={navRef}>
        <Breadcrumb.List>
          <Breadcrumb.Item>
            <Breadcrumb.Link ref={linkRef} href="/">
              Home
            </Breadcrumb.Link>
          </Breadcrumb.Item>
        </Breadcrumb.List>
      </Breadcrumb>,
    );
    expect(navRef.current).toBeInstanceOf(HTMLElement);
    expect(navRef.current?.tagName).toBe("NAV");
    expect(linkRef.current).toBeInstanceOf(HTMLAnchorElement);
  });

  it("axe: no violations on full composition with ellipsis", async () => {
    const { container } = renderTrail(ellipsisTrail);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("barrel exports Breadcrumb with the full namespace", () => {
    expect(BreadcrumbFromBarrel).toBe(Breadcrumb);
    expect(BreadcrumbFromBarrel.List).toBeDefined();
  });

  it("default story renders the canonical trail", () => {
    render(<DefaultStory />);
    expect(screen.getByRole("navigation")).toHaveAttribute("aria-label", "breadcrumb");
    expect(screen.getByText("Violet Forge")).toHaveAttribute("aria-current", "page");
  });
});
