import type { Story } from "@ladle/react";
import type { TrendChartProps, TrendPoint } from "./trend-chart.js";
import { TrendChart } from "./trend-chart.js";

export default {
  title: "Composites / Data Display / TrendChart",
};

const bucket = (...ys: number[]): TrendPoint[] => ys.map((y, x) => ({ x, y }));

const chartStory = (props: TrendChartProps): Story => {
  const Rendered: Story = () => (
    <div className="max-w-xl">
      <TrendChart {...props} />
    </div>
  );
  return Rendered;
};

/** The theo-rag analytics case: p50/p95 retrieval latency per window (DoD b3). */
export const RagLatency = chartStory({
  title: "Retrieval latency",
  valueFormatter: (v) => `${v}ms`,
  series: [
    { name: "p50", color: "var(--primary)", points: bucket(42, 38, 51, 44, 40, 47, 39) },
    { name: "p95", color: "#f59e0b", points: bucket(180, 165, 210, 190, 172, 240, 185) },
  ],
});

/** The dashboard case (lens): a sparse and a dense series together — M76 markers visible. */
export const MultiSeries = chartStory({
  title: "Requests by surface",
  series: [
    { name: "api", color: "var(--primary)", points: bucket(120, 180, 150, 200, 170, 210) },
    {
      name: "webhooks (sparse)",
      color: "#0ea5e9",
      points: [
        { x: 1, y: 40 },
        { x: 4, y: 90 },
      ],
    },
  ],
});

export const Empty = chartStory({
  title: "No traffic",
  series: [{ name: "api", color: "var(--primary)", points: [] }],
});
