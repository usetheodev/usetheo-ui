import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { AnnotationSummaryGroup as FromBarrel } from "../../../index.js";
import type {
  AnnotationCategoricalConfig,
  AnnotationContinuousConfig,
  AnnotationFreeformConfig,
} from "../annotation-input/types.js";
import { AnnotationSummaryGroup } from "./annotation-summary-group.js";

const continuous: AnnotationContinuousConfig = { type: "continuous", min: 0, max: 1, step: 0.1 };
const categorical: AnnotationCategoricalConfig = {
  type: "categorical",
  options: [{ label: "good" }, { label: "bad" }],
};
const freeform: AnnotationFreeformConfig = { type: "freeform", maxLength: 200 };

const renderQuality = (values: string[]) =>
  render(
    <AnnotationSummaryGroup config={categorical} values={values} label="Quality" defaultOpen />,
  );

describe("AnnotationSummaryGroup — aggregation", () => {
  it("continuous shows the mean of the finite values", () => {
    const { container } = render(
      <AnnotationSummaryGroup config={continuous} values={[0, 1, 0.5]} defaultOpen />,
    );
    const root = container.querySelector('[data-slot="annotation-summary-group"]');
    // mean of 0, 1, 0.5 = 0.5
    expect(root).toHaveTextContent(/0\.5/);
    expect(root).toHaveTextContent(/3/); // count
  });

  it("continuous ignores non-finite values when averaging", () => {
    const { container } = render(
      <AnnotationSummaryGroup
        config={continuous}
        values={[2, Number.NaN, Number.POSITIVE_INFINITY, 4]}
        defaultOpen
      />,
    );
    const root = container.querySelector('[data-slot="annotation-summary-group"]');
    // mean of the 2 finite values (2, 4) = 3
    expect(root).toHaveTextContent(/3/);
  });

  it("categorical shows the count per option", () => {
    renderQuality(["good", "good", "bad"]);
    const goodRow = screen.getByText("good").closest("li") as HTMLElement;
    expect(within(goodRow).getByText("2")).toBeInTheDocument();
    const badRow = screen.getByText("bad").closest("li") as HTMLElement;
    expect(within(badRow).getByText("1")).toBeInTheDocument();
  });

  it("freeform shows the count of non-empty values", () => {
    const { container } = render(
      <AnnotationSummaryGroup config={freeform} values={["hi", "", "yo"]} defaultOpen />,
    );
    const root = container.querySelector('[data-slot="annotation-summary-group"]');
    expect(root).toHaveTextContent(/2/); // 2 non-empty
  });
});

describe("AnnotationSummaryGroup — states", () => {
  it("an empty values array → an honest empty state", () => {
    const { container } = render(<AnnotationSummaryGroup config={continuous} values={[]} />);
    expect(container.querySelector('[data-slot="annotation-summary-group-empty"]')).not.toBeNull();
  });

  it("collapsible: opens and closes through the summary", () => {
    render(
      <AnnotationSummaryGroup
        config={continuous}
        values={[0.5]}
        label="Rating"
        defaultOpen={false}
      />,
    );
    const details = screen.getByText(/rating/i).closest("details") as HTMLDetailsElement;
    expect(details.open).toBe(false);
    fireEvent.click(screen.getByText(/rating/i));
    expect(details.open).toBe(true);
  });

  it("is exported from the root barrel", () => {
    expect(FromBarrel).toBe(AnnotationSummaryGroup);
  });

  it("sem violações axe — categorical", async () => {
    const { container } = renderQuality(["good", "bad"]);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("sem violações axe — empty", async () => {
    const { container } = render(<AnnotationSummaryGroup config={freeform} values={[]} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
