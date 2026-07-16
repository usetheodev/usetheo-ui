import type { Story } from "@ladle/react";

import { SeverityBadge } from "./severity-badge.js";

export const AllSeverities: Story = () => (
  <div className="flex flex-col items-start gap-3 p-6">
    <SeverityBadge severity="ok" />
    <SeverityBadge severity="warning" />
    <SeverityBadge severity="alert" />
    <SeverityBadge severity="no_data" />
    <SeverityBadge severity="unknown" />
    <SeverityBadge severity="paused" />
  </div>
);

export const CustomLabels: Story = () => (
  <div className="flex flex-col items-start gap-3 p-6">
    <SeverityBadge severity="ok" label="Healthy" />
    <SeverityBadge severity="alert" label="Critical" />
    <SeverityBadge severity="paused" label="Snoozed" />
  </div>
);

export const CustomVariantMap: Story = () => (
  <div className="flex flex-col items-start gap-3 p-6">
    <SeverityBadge severity="warning" variantMap={{ warning: "accent" }} />
    <SeverityBadge severity="ok" variantMap={{ ok: "primary" }} />
  </div>
);
