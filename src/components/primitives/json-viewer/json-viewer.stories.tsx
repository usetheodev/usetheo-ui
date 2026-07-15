import type { Story } from "@ladle/react";
import { Badge } from "../badge/index.js";
import { DescriptionList } from "../description-list/index.js";
import { JsonViewer } from "./json-viewer.js";

export default {
  title: "Primitives / Data Display / JsonViewer",
};

/** Shape real do event inspector do theokit-studio (typed events do SDK). */
const eventPayload = {
  type: "tool.call",
  runId: "run_8f31",
  agent: "support-triage",
  tool: {
    name: "search_tickets",
    input: { query: "billing overdue", limit: 10 },
    output: { hits: 3, tookMs: 41 },
  },
  usage: { promptTokens: 812, completionTokens: 128 },
  longNote:
    "This is a deliberately long annotation to demonstrate string truncation behavior in the viewer — click to reveal the rest of it.",
};

export const EventPayload: Story = () => (
  <div className="max-w-xl">
    <JsonViewer value={eventPayload} enableCopy />
  </div>
);

export const CollapsedDepth: Story = () => (
  <div className="max-w-xl">
    <JsonViewer value={eventPayload} collapsed={1} enableCopy />
  </div>
);

/**
 * Detail panel — o painel de detalhe de memória (theo-memory) em miniatura:
 * metadados no DescriptionList + payload JSONB no JsonViewer.
 */
export const DetailPanel: Story = () => (
  <div className="grid max-w-xl gap-6">
    <DescriptionList layout="horizontal">
      <DescriptionList.Item>
        <DescriptionList.Term>ID</DescriptionList.Term>
        <DescriptionList.Detail>
          <code className="font-mono text-code-sm">mem_8f3a…c21</code>
        </DescriptionList.Detail>
      </DescriptionList.Item>
      <DescriptionList.Item>
        <DescriptionList.Term>Status</DescriptionList.Term>
        <DescriptionList.Detail>
          <Badge variant="success">active</Badge>
        </DescriptionList.Detail>
      </DescriptionList.Item>
    </DescriptionList>
    <div className="grid gap-2">
      <span className="text-body-sm text-muted-foreground">Payload</span>
      <JsonViewer value={eventPayload} collapsed={1} />
    </div>
  </div>
);
