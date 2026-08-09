import type { Story } from "@ladle/react";
import type { ReactNode } from "react";
import { Badge } from "../badge/index.js";
import { Timestamp } from "../timestamp/index.js";
import { DescriptionList } from "./description-list.js";

export default {
  title: "Primitives / Data Display / DescriptionList",
};

const pair = (term: string, detail: ReactNode) => (
  <DescriptionList.Item key={term}>
    <DescriptionList.Term>{term}</DescriptionList.Term>
    <DescriptionList.Detail>{detail}</DescriptionList.Detail>
  </DescriptionList.Item>
);

/** A memory's metadata (theo-memory) — M2's detail-panel case. */
const memoryMeta = [
  pair("ID", <code className="font-mono text-code-sm">mem_8f3a…c21</code>),
  pair("Status", <Badge variant="success">active</Badge>),
  pair("Scope", "user / paulo"),
  pair("Confirmations", "3"),
  pair("Created", <Timestamp value={new Date("2026-07-01T12:00:00Z")} format="absolute" />),
];

export const Vertical: Story = () => (
  <div className="max-w-sm">
    <DescriptionList>{memoryMeta}</DescriptionList>
  </div>
);

export const Horizontal: Story = () => (
  <div className="max-w-md">
    <DescriptionList layout="horizontal">{memoryMeta}</DescriptionList>
  </div>
);

export const HorizontalDense: Story = () => (
  <div className="max-w-md">
    <DescriptionList layout="horizontal" dense>
      {memoryMeta}
    </DescriptionList>
  </div>
);
