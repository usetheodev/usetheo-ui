import type { Story } from "@ladle/react";
import { AttributesTable } from "./attributes-table.js";

export default { title: "Composites / Observability / AttributesTable" };

const ATTRS = {
  "gen_ai.request.model": "claude-fable-5",
  "gen_ai.usage.input_tokens": 900,
  "gen_ai.usage.output_tokens": 120,
  "user.email": "traveler@example.com",
  "user.id": "u_8842",
  "http.method": "POST",
  "http.status_code": 200,
  "retrieval.documents": { count: 3, ids: ["doc-1", "doc-2", "doc-3"] },
};

const isPii = (key: string) => key === "user.email" || key === "user.id";

export const Grouped: Story = () => (
  <div className="max-w-xl">
    <AttributesTable attrs={ATTRS} promoted={["gen_ai.request.model"]} />
  </div>
);

export const MaskedFailClosed: Story = () => (
  <div className="max-w-xl">
    <AttributesTable attrs={ATTRS} maskedKeys={isPii} canReveal={false} />
  </div>
);

export const MaskedRevealable: Story = () => (
  <div className="max-w-xl">
    <AttributesTable attrs={ATTRS} maskedKeys={isPii} canReveal />
  </div>
);

export const Empty: Story = () => <AttributesTable attrs={{}} />;
