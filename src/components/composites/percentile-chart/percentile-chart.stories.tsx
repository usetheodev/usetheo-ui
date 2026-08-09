import type { Story } from "@ladle/react";
import type { PercentileChartProps } from "./percentile-chart.js";
import { PercentileChart } from "./percentile-chart.js";

export default {
  title: "Composites / Data Display / PercentileChart",
};

const chartStory = (props: PercentileChartProps): Story => {
  const Rendered: Story = () => (
    <div className="max-w-xl">
      <PercentileChart {...props} />
    </div>
  );
  return Rendered;
};

/** The lens case: p50/p95/p99 latency per window (the LatencyBucket /observability already returns). */
export const Latency = chartStory({
  title: "Request latency",
  valueFormatter: (v) => `${Math.round(v)}ms`,
  buckets: [
    { label: "10:00", p50: 40, p95: 120, p99: 240 },
    { label: "10:05", p50: 44, p95: 130, p99: 260 },
    { label: "10:10", p50: 38, p95: 110, p99: 210 },
    { label: "10:15", p50: 50, p95: 150, p99: 300 },
    { label: "10:20", p50: 46, p95: 138, p99: 280 },
    { label: "10:25", p50: 42, p95: 125, p99: 250 },
  ],
});

/** A wide tail — the p95–p99 band opens up: the spread reads instantly. */
export const WideTail = chartStory({
  title: "Token latency",
  valueFormatter: (v) => `${Math.round(v)}ms`,
  buckets: [
    { label: "t1", p50: 30, p95: 90, p99: 400 },
    { label: "t2", p50: 32, p95: 95, p99: 520 },
    { label: "t3", p50: 28, p95: 88, p99: 360 },
    { label: "t4", p50: 35, p95: 110, p99: 610 },
  ],
});

/** An honest empty state — no data in the window. */
export const Empty = chartStory({
  title: "Request latency",
  buckets: [],
});
