import type { Story } from "@ladle/react";
import type { HistogramProps } from "./histogram.js";
import { Histogram } from "./histogram.js";

export default {
  title: "Composites / Data Display / Histogram",
};

const histogramStory = (props: HistogramProps): Story => {
  const Rendered: Story = () => (
    <div className="max-w-xl">
      <Histogram {...props} />
    </div>
  );
  return Rendered;
};

/** Caso lens: distribuição de duração de traces (ms), binada client-side da traces-list. */
export const TraceDurations = histogramStory({
  title: "Trace duration",
  valueFormatter: (v) => `${Math.round(v)}ms`,
  values: [
    12, 18, 22, 25, 31, 33, 34, 40, 42, 44, 45, 48, 51, 55, 60, 61, 63, 70, 88, 120, 140, 210,
  ],
  binCount: 8,
});

/** Caso pré-computado: o consumidor passa bins prontos (ex. do backend). */
export const PrecomputedBins = histogramStory({
  title: "Score distribution",
  bins: [
    { lo: 0, hi: 0.2, count: 3 },
    { lo: 0.2, hi: 0.4, count: 8 },
    { lo: 0.4, hi: 0.6, count: 15 },
    { lo: 0.6, hi: 0.8, count: 22 },
    { lo: 0.8, hi: 1, count: 11 },
  ],
  valueFormatter: (v) => v.toFixed(1),
});

/** Empty state honesto — sem dados para distribuir. */
export const Empty = histogramStory({
  title: "Trace duration",
  bins: [],
});
