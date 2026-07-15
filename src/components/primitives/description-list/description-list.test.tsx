import { render, screen } from "@testing-library/react";
import { createRef } from "react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { DescriptionList as DescriptionListFromBarrel } from "../../../index.js";
import type { DescriptionListProps } from "./description-list.js";
import { DescriptionList } from "./description-list.js";
import { Vertical as VerticalStory } from "./description-list.stories.js";

const entry = (term: string, detail: ReactNode) => (
  <DescriptionList.Item key={term}>
    <DescriptionList.Term>{term}</DescriptionList.Term>
    <DescriptionList.Detail>{detail}</DescriptionList.Detail>
  </DescriptionList.Item>
);

const THREE = [entry("Status", "live"), entry("Region", "us-east-1"), entry("Owner", "paulo")];

function renderDl(props: Partial<DescriptionListProps> = {}, children: ReactNode = THREE) {
  return render(<DescriptionList {...props}>{children}</DescriptionList>);
}

describe("DescriptionList — semantics & layout", () => {
  it("renders semantic dl > dt + dd pairs", () => {
    const { container } = renderDl();
    const dl = container.querySelector("dl");
    expect(dl).not.toBeNull();
    expect(dl?.querySelectorAll("dt")).toHaveLength(3);
    expect(dl?.querySelectorAll("dd")).toHaveLength(3);
  });

  it("n items render n terms and details with visible text", () => {
    renderDl();
    expect(screen.getByText("Status")).toBeInTheDocument();
    expect(screen.getByText("us-east-1")).toBeInTheDocument();
  });

  it("vertical layout is the default", () => {
    const { container } = renderDl();
    expect(container.querySelector("dl")).toHaveAttribute("data-layout", "vertical");
  });

  it("horizontal layout applies the grid variant", () => {
    const { container } = renderDl({ layout: "horizontal" });
    const dl = container.querySelector("dl");
    expect(dl).toHaveAttribute("data-layout", "horizontal");
    expect(dl?.className).toContain("grid");
  });

  it("dense flag marks the root for compact tokens", () => {
    const { container } = renderDl({ dense: true });
    expect(container.querySelector("dl")).toHaveAttribute("data-dense", "true");
  });

  it("an item allows multiple details for one term", () => {
    const { container } = renderDl(
      {},
      <DescriptionList.Item>
        <DescriptionList.Term>Aliases</DescriptionList.Term>
        <DescriptionList.Detail>a.example.com</DescriptionList.Detail>
        <DescriptionList.Detail>b.example.com</DescriptionList.Detail>
      </DescriptionList.Item>,
    );
    expect(container.querySelectorAll("dd")).toHaveLength(2);
  });

  it("empty list renders a valid dl without crash (edge)", () => {
    const { container } = renderDl({}, null);
    expect(container.querySelector("dl")).not.toBeNull();
  });
});

describe("DescriptionList — wiring & a11y", () => {
  it("all subs carry data-slot attributes", () => {
    const { container } = renderDl();
    for (const slot of [
      "description-list",
      "description-list-item",
      "description-list-term",
      "description-list-detail",
    ]) {
      expect(container.querySelector(`[data-slot="${slot}"]`)).not.toBeNull();
    }
  });

  it("root forwards ref to the dl element", () => {
    const ref = createRef<HTMLDListElement>();
    render(<DescriptionList ref={ref}>{THREE}</DescriptionList>);
    expect(ref.current?.tagName).toBe("DL");
  });

  it("axe: no violations on both layouts", async () => {
    const { container } = render(
      <div>
        <DescriptionList>{THREE}</DescriptionList>
        <DescriptionList layout="horizontal">{THREE}</DescriptionList>
      </div>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("DescriptionList — story smoke", () => {
  it("vertical story renders the memory metadata panel", () => {
    const { container } = render(<VerticalStory />);
    expect(container.querySelector("dl")).not.toBeNull();
    expect(screen.getByText("Scope")).toBeInTheDocument();
  });
});

describe("DescriptionList — barrel", () => {
  it("barrel exports the same symbol", () => {
    expect(DescriptionListFromBarrel).toBe(DescriptionList);
  });
});
