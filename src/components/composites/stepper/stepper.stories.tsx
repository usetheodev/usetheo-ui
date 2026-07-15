import type { Story } from "@ladle/react";
import { Badge } from "../../primitives/badge/index.js";
import { StatusDot } from "../../primitives/status-dot/index.js";
import { Timestamp } from "../../primitives/timestamp/index.js";
import type { StepperStepData } from "./stepper.js";
import { Stepper, deriveSteps } from "./stepper.js";

export default {
  title: "Composites / Data Display / Stepper",
};

const stepperStory = (label: string, steps: StepperStepData[], horizontal = false): Story => {
  const Rendered: Story = () => (
    <div className="max-w-md">
      <Stepper label={label} steps={steps} orientation={horizontal ? "horizontal" : "vertical"} />
    </div>
  );
  return Rendered;
};

/** Caso dashboard: build pipeline com falha no push + retry slot (DoD b2). */
export const BuildPipelineFailed = stepperStory("Build pipeline", [
  {
    id: "queued",
    label: "Queued",
    description: "Build accepted, waiting for runner.",
    status: "done",
  },
  {
    id: "running",
    label: "Building",
    description: "Cloning, installing, compiling.",
    status: "done",
  },
  {
    id: "pushing",
    label: "Pushing image",
    description: "registry: 401 Unauthorized — check the robot account token.",
    status: "failed",
    retry: (
      <button
        type="button"
        className="rounded-md border border-border px-2 py-1 text-label hover:bg-muted"
      >
        Retry build
      </button>
    ),
  },
  { id: "signing", label: "Signing", status: "pending" },
  { id: "releasing", label: "Releasing", status: "pending" },
  { id: "succeeded", label: "Live", status: "pending" },
]);

/** Caso theo-rag: ingest pipeline com timestamps por etapa (DoD b2). */
export const IngestPipeline = stepperStory("Document ingest", [
  {
    id: "partition",
    label: "Partitioned",
    status: "done",
    timestamp: <Timestamp value="2026-07-15T10:00:00Z" format="absolute" />,
  },
  {
    id: "chunk",
    label: "Chunked",
    status: "done",
    timestamp: <Timestamp value="2026-07-15T10:01:30Z" format="absolute" />,
  },
  { id: "embed", label: "Embedded", description: "Generating vectors.", status: "active" },
  { id: "index", label: "Indexed", status: "pending" },
  { id: "ready", label: "Ready", status: "pending" },
]);

/** Composição com StatusDot/Badge existentes — mesma semântica de status, sem duplicação (DoD b3). */
export const ComposicaoStatus: Story = () => (
  <div className="max-w-md space-y-3">
    <div className="flex items-center gap-2">
      <StatusDot status="building" label="Deploy em andamento" />
      <Badge>staging</Badge>
    </div>
    <Stepper
      label="Deploy pipeline"
      steps={deriveSteps(
        [
          { id: "queued", label: "Queued" },
          { id: "build", label: "Building" },
          { id: "release", label: "Releasing" },
        ],
        1,
      )}
    />
  </div>
);

/** Orientação horizontal (fluxo curto de onboarding). */
export const Horizontal = stepperStory(
  "Onboarding",
  deriveSteps(
    [
      { id: "account", label: "Account" },
      { id: "workspace", label: "Workspace" },
      { id: "invite", label: "Invite team" },
    ],
    1,
  ),
  true,
);
