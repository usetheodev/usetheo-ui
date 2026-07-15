import { render } from "@testing-library/react";
import { createRef } from "react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import type { StepperStepData } from "./stepper.js";
import { Stepper, deriveSteps } from "./stepper.js";

const step = (
  id: string,
  status: StepperStepData["status"],
  extra: Partial<StepperStepData> = {},
): StepperStepData => ({ id, label: id, status, ...extra });

function renderStepper(steps: StepperStepData[], props: Record<string, unknown> = {}) {
  return render(<Stepper label="Pipeline" steps={steps} {...props} />);
}

const slots = (container: HTMLElement, slot: string) =>
  container.querySelectorAll(`[data-slot="${slot}"]`);

const withStates = (...statuses: StepperStepData["status"][]): StepperStepData[] =>
  statuses.map((status, i) => step(`s${i}`, status));

describe("deriveSteps — pure helper", () => {
  const defs = [
    { id: "a", label: "A" },
    { id: "b", label: "B" },
    { id: "c", label: "C" },
  ];

  it("test_derivesteps_marks_before_active_after", () => {
    expect(deriveSteps(defs, 1).map((s) => s.status)).toEqual(["done", "active", "pending"]);
  });

  it("test_derivesteps_clamps_out_of_range_index", () => {
    expect(deriveSteps(defs, 100).map((s) => s.status)).toEqual(["done", "done", "done"]);
    expect(deriveSteps(defs, -1).map((s) => s.status)).toEqual(["pending", "pending", "pending"]);
  });

  it("test_derivesteps_empty_defs_returns_empty", () => {
    expect(deriveSteps([], 0)).toEqual([]);
  });
});

describe("Stepper — estados e anatomia", () => {
  it("test_renders_one_li_per_step_with_data_state", () => {
    const { container } = renderStepper(withStates("done", "active", "failed", "pending"));
    const items = slots(container, "stepper-step");
    expect(items).toHaveLength(4);
    expect([...items].map((li) => li.getAttribute("data-state"))).toEqual([
      "done",
      "active",
      "failed",
      "pending",
    ]);
  });

  it("test_icon_per_state_rendered_aria_hidden", () => {
    const { container } = renderStepper(withStates("done", "active", "failed", "pending"));
    const icons = slots(container, "stepper-icon");
    expect(icons).toHaveLength(4);
    // F-tests-1: pina o MAPA estado→glifo, não só "tem svg"
    const glyphs = ["lucide-check", "lucide-loader-circle", "lucide-x", "lucide-circle-dashed"];
    [...icons].forEach((icon, i) => {
      expect(icon.getAttribute("aria-hidden")).toBe("true");
      expect(icon.querySelector("svg")?.getAttribute("class")).toContain(glyphs[i]);
    });
  });

  it("test_active_step_has_aria_current_step", () => {
    const { container } = renderStepper(withStates("done", "active", "pending"));
    const current = container.querySelectorAll('[aria-current="step"]');
    expect(current).toHaveLength(1);
    expect(current[0]?.getAttribute("data-state")).toBe("active");
  });

  it("test_failed_step_renders_retry_slot", () => {
    const { container } = renderStepper([
      step("a", "failed", { retry: <button type="button">Retry</button> }),
    ]);
    const retry = slots(container, "stepper-retry");
    expect(retry).toHaveLength(1);
    expect(retry[0]?.textContent).toContain("Retry");
  });

  it("test_retry_slot_not_rendered_on_non_failed", () => {
    const { container } = renderStepper([
      step("a", "done", { retry: <button type="button">Retry</button> }),
      step("b", "active", { retry: <button type="button">Retry</button> }),
    ]);
    expect(slots(container, "stepper-retry")).toHaveLength(0);
  });

  it("test_failed_state_communicated_in_text", () => {
    const { container } = renderStepper([step("deploy", "failed")]);
    // F-tests-3: o texto de estado fica DENTRO do label (uma frase acessível única)
    const label = slots(container, "stepper-label")[0];
    expect(label?.textContent?.toLowerCase()).toContain("failed");
  });

  it("test_done_and_pending_states_communicated_in_text", () => {
    // F-dom-1: leitor de tela distingue done/pending sem depender de cor/ícone
    const { container } = renderStepper(withStates("done", "pending"));
    const labels = slots(container, "stepper-label");
    expect(labels[0]?.textContent?.toLowerCase()).toContain("completed");
    expect(labels[1]?.textContent?.toLowerCase()).toContain("not started");
  });

  it("test_description_rendered_when_present", () => {
    const { container } = renderStepper([step("a", "done", { description: "cloning repo" })]);
    expect(slots(container, "stepper-step")[0]?.textContent).toContain("cloning repo");
  });

  it("test_description_absent_renders_no_extra_paragraph", () => {
    const { container } = renderStepper([step("a", "done")]);
    expect(slots(container, "stepper-step")[0]?.querySelectorAll("p")).toHaveLength(1);
  });

  it("test_timestamp_slot_rendered_when_present", () => {
    const { container } = renderStepper([
      step("a", "done", { timestamp: <time>2026-07-15</time> }),
    ]);
    const ts = slots(container, "stepper-timestamp");
    expect(ts).toHaveLength(1);
    expect(ts[0]?.textContent).toContain("2026-07-15");
  });

  it("test_timestamp_absent_renders_no_slot", () => {
    const { container } = renderStepper([step("a", "done")]);
    expect(slots(container, "stepper-timestamp")).toHaveLength(0);
  });

  it("test_default_orientation_is_vertical", () => {
    const { container } = renderStepper([step("a", "done")]);
    expect(slots(container, "stepper")[0]?.getAttribute("data-orientation")).toBe("vertical");
  });

  it("test_horizontal_orientation_data_attribute", () => {
    const { container } = renderStepper([step("a", "done")], { orientation: "horizontal" });
    expect(slots(container, "stepper")[0]?.getAttribute("data-orientation")).toBe("horizontal");
  });

  it("test_long_label_truncates_with_title_attr", () => {
    const long = "a-step-name-long-enough-to-truncate-in-any-reasonable-column";
    const { container } = renderStepper([{ id: "x", label: long, status: "done" }]);
    const label = slots(container, "stepper-label")[0];
    expect(label?.getAttribute("title")).toBe(long);
    expect(label?.className).toContain("truncate");
  });
});

describe("Stepper — edges e negatives", () => {
  it("test_single_step_renders", () => {
    const { container } = renderStepper([step("only", "active")]);
    expect(slots(container, "stepper-step")).toHaveLength(1);
  });

  it("test_all_done_pipeline_renders", () => {
    const { container } = renderStepper([step("a", "done"), step("b", "done")]);
    expect(container.querySelectorAll('[aria-current="step"]')).toHaveLength(0);
    expect(slots(container, "stepper-step")).toHaveLength(2);
  });

  it("test_empty_steps_renders_ol_without_items", () => {
    const { container } = renderStepper([]);
    const root = slots(container, "stepper")[0];
    expect(root?.tagName).toBe("OL");
    expect(slots(container, "stepper-step")).toHaveLength(0);
  });

  it("test_steps_are_not_buttons", () => {
    const { container } = renderStepper(withStates("done", "active", "pending"));
    expect(container.querySelectorAll('[data-slot="stepper-step"] button')).toHaveLength(0);
    expect(container.querySelectorAll('[role="button"]')).toHaveLength(0);
  });

  // F-tests-2 + F-arch-2: fallback é ESPECIFICAMENTE o visual pending e o
  // data-state normalizado acompanha o que foi renderizado
  const expectPendingDegradation = (bogusStatus: string) => {
    const { container } = renderStepper([
      { id: "x", label: "X", status: bogusStatus as StepperStepData["status"] },
    ]);
    const icon = slots(container, "stepper-icon")[0];
    expect(icon?.querySelector("svg")?.getAttribute("class")).toContain("lucide-circle-dashed");
    expect(slots(container, "stepper-step")[0]?.getAttribute("data-state")).toBe("pending");
  };

  it("test_unknown_status_falls_back_to_pending_visual", () => {
    expectPendingDegradation("running");
  });

  it("test_prototype_key_status_degrades_safely", () => {
    // F-arch-1/F-dom-2: "toString" passa no guard `in` (prototype chain); Object.hasOwn não
    expectPendingDegradation("toString");
  });

  it("test_multiple_active_steps_each_get_aria_current", () => {
    const { container } = renderStepper([step("a", "active"), step("b", "active")]);
    expect(container.querySelectorAll('[aria-current="step"]')).toHaveLength(2);
  });
});

describe("Stepper — wiring & a11y", () => {
  it("test_all_parts_have_data_slot", () => {
    const { container } = renderStepper([
      step("a", "done", { description: "desc", timestamp: <time>t</time> }),
    ]);
    for (const slot of ["stepper", "stepper-step", "stepper-icon", "stepper-label"]) {
      expect(slots(container, slot).length).toBeGreaterThan(0);
    }
    expect(slots(container, "stepper")[0]?.getAttribute("aria-label")).toBe("Pipeline");
  });

  it("test_root_forwards_ref", () => {
    const ref = createRef<HTMLOListElement>();
    render(<Stepper ref={ref} label="P" steps={[step("a", "done")]} />);
    expect(ref.current?.tagName).toBe("OL");
  });

  it("test_axe_no_violations", async () => {
    const { container } = render(
      <div>
        <Stepper
          label="Vertical failed"
          steps={[
            step("a", "done"),
            step("b", "failed", { retry: <button type="button">Retry</button> }),
            step("c", "pending"),
          ]}
        />
        <Stepper
          label="Horizontal"
          orientation="horizontal"
          steps={[step("x", "done"), step("y", "active")]}
        />
      </div>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});

describe("Stepper — story smoke", () => {
  it("test_build_pipeline_story_renders_failed_with_retry", async () => {
    const { BuildPipelineFailed } = await import("./stepper.stories.js");
    const { container } = render(<BuildPipelineFailed />);
    expect(container.querySelectorAll('[data-slot="stepper-step"]').length).toBe(6);
    expect(container.querySelectorAll('[data-slot="stepper-retry"]').length).toBe(1);
  });
});

describe("Stepper — barrel", () => {
  it("test_barrel_exports_stepper", async () => {
    const barrel = await import("../../../index.js");
    expect(barrel.Stepper).toBe(Stepper);
    expect(barrel.deriveSteps).toBe(deriveSteps);
  });
});
