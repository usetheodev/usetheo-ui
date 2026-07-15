import type { Story } from "@ladle/react";
import type { ReactNode } from "react";
import { Slider } from "./slider.js";

export default {
  title: "Primitives / Forms / Slider",
};

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="grid max-w-md gap-2">
      <span className="text-body-sm text-muted-foreground">{label}</span>
      {children}
    </div>
  );
}

export const Default: Story = () => (
  <Row label="Volume">
    <Slider aria-label="Volume" defaultValue={[50]} />
  </Row>
);

export const Range: Story = () => (
  <Row label="Price range">
    <Slider aria-label="Price range" defaultValue={[20, 80]} />
  </Row>
);

/** Playground do theo-memory/theo-rag: topK 1-100 (step 1) e threshold 0-1 (step 0.05). */
export const WithMarks: Story = () => (
  <div className="grid max-w-md gap-8">
    <Row label="Top K (1-100)">
      <Slider
        aria-label="Top K"
        min={1}
        max={100}
        defaultValue={[5]}
        marks={[{ value: 1 }, { value: 25 }, { value: 50 }, { value: 75 }, { value: 100 }]}
      />
    </Row>
    <Row label="Threshold (0-1, step 0.05)">
      <Slider
        aria-label="Threshold"
        min={0}
        max={1}
        step={0.05}
        defaultValue={[0.5]}
        marks={[{ value: 0 }, { value: 0.5 }, { value: 1 }]}
      />
    </Row>
  </div>
);

export const Disabled: Story = () => (
  <Row label="Disabled">
    <Slider aria-label="Disabled" defaultValue={[30]} disabled marks={[{ value: 30 }]} />
  </Row>
);

export const Vertical: Story = () => (
  <Row label="Vertical">
    <div className="h-48">
      <Slider aria-label="Vertical" orientation="vertical" defaultValue={[60]} />
    </div>
  </Row>
);
