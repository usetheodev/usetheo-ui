import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";

import * as barrel from "../../../index.js";
import { SeverityBadge } from "./severity-badge.js";

describe("SeverityBadge", () => {
  it("maps severity=alert to variant=destructive", () => {
    render(<SeverityBadge severity="alert" data-testid="sb" />);
    expect(screen.getByTestId("sb").getAttribute("data-variant")).toBe("destructive");
  });

  it("maps severity=ok to variant=success", () => {
    render(<SeverityBadge severity="ok" data-testid="sb" />);
    expect(screen.getByTestId("sb").getAttribute("data-variant")).toBe("success");
  });

  it("maps severity=warning to variant=warning", () => {
    render(<SeverityBadge severity="warning" data-testid="sb" />);
    expect(screen.getByTestId("sb").getAttribute("data-variant")).toBe("warning");
  });

  it("maps no_data/unknown/paused to the neutral outline variant", () => {
    for (const severity of ["no_data", "unknown", "paused"] as const) {
      render(<SeverityBadge severity={severity} data-testid={`sb-${severity}`} />);
      expect(screen.getByTestId(`sb-${severity}`).getAttribute("data-variant")).toBe("outline");
    }
  });

  it("falls back to the neutral outline variant for an unmapped severity value (never crashes)", () => {
    // Cast: exercise the honest runtime fallback for values outside the Severity union.
    render(<SeverityBadge severity={"bogus" as never} data-testid="sb" />);
    expect(screen.getByTestId("sb").getAttribute("data-variant")).toBe("outline");
  });

  it("respects an explicit label override", () => {
    render(<SeverityBadge severity="alert" label="Critical" data-testid="sb" />);
    expect(screen.getByTestId("sb").textContent).toBe("Critical");
  });

  it("respects a per-severity variantMap override", () => {
    render(<SeverityBadge severity="ok" variantMap={{ ok: "primary" }} data-testid="sb" />);
    expect(screen.getByTestId("sb").getAttribute("data-variant")).toBe("primary");
  });

  it("derives a human-readable default label from the severity", () => {
    render(<SeverityBadge severity="no_data" data-testid="sb-nodata" />);
    expect(screen.getByTestId("sb-nodata").textContent).toBe("No data");

    render(<SeverityBadge severity="ok" data-testid="sb-ok" />);
    expect(screen.getByTestId("sb-ok").textContent).toBe("OK");

    render(<SeverityBadge severity="alert" data-testid="sb-alert" />);
    expect(screen.getByTestId("sb-alert").textContent).toBe("Alert");
  });

  it("sets data-slot and data-severity attributes", () => {
    render(<SeverityBadge severity="warning" data-testid="sb" />);
    const el = screen.getByTestId("sb");
    expect(el.getAttribute("data-slot")).toBe("severity-badge");
    expect(el.getAttribute("data-severity")).toBe("warning");
  });

  it("has no axe violations across all severities", async () => {
    const { container } = render(
      <div>
        <SeverityBadge severity="ok" />
        <SeverityBadge severity="warning" />
        <SeverityBadge severity="alert" />
        <SeverityBadge severity="no_data" />
        <SeverityBadge severity="unknown" />
        <SeverityBadge severity="paused" />
      </div>,
    );
    expect(await axe(container)).toHaveNoViolations();
  });

  it("is re-exported from the package barrel (export identity)", async () => {
    expect(barrel.SeverityBadge).toBe(SeverityBadge);
  });
});
