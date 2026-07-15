import type { Story } from "@ladle/react";
import { useMemo, useState } from "react";
import { Slider } from "../slider/slider.js";
import { Combobox } from "./combobox.js";

export default {
  title: "Primitives / Forms / Combobox",
};

const COLLECTIONS = ["atlantis-facts", "d4-ui-dogfood", "product-docs", "support-tickets"];

const collectionItems = (items: string[]) =>
  items.map((collection) => (
    <Combobox.Item key={collection} value={collection}>
      {collection}
    </Combobox.Item>
  ));

export const Basic: Story = () => {
  const [value, setValue] = useState<string>();
  return (
    <div className="max-w-sm">
      <Combobox aria-label="Collection" value={value} onValueChange={setValue}>
        <Combobox.Input placeholder="Select a collection" />
        <Combobox.Content>
          <Combobox.Empty>No collections found.</Combobox.Empty>
          {collectionItems(COLLECTIONS)}
        </Combobox.Content>
      </Combobox>
      <p className="mt-2 text-caption text-muted-foreground">Selected: {value ?? "(none)"}</p>
    </div>
  );
};

/**
 * Async pattern: `shouldFilter={false}` + consumer-filtered items + `loading`
 * while the fetch is in flight (cmdk's documented async recipe).
 */
export const AsyncFiltering: Story = () => {
  const [value, setValue] = useState<string>();
  const [search, setSearch] = useState("");
  const items = useMemo(
    () => COLLECTIONS.filter((c) => c.includes(search.toLowerCase())),
    [search],
  );
  return (
    <div className="max-w-sm">
      <Combobox
        aria-label="Collection (async)"
        value={value}
        onValueChange={setValue}
        shouldFilter={false}
      >
        <Combobox.Input placeholder="Search collections…" onValueChange={setSearch} />
        <Combobox.Content>
          <Combobox.Empty>No match for “{search}”.</Combobox.Empty>
          {collectionItems(items)}
        </Combobox.Content>
      </Combobox>
    </div>
  );
};

export const Loading: Story = () => (
  <div className="max-w-sm">
    <Combobox aria-label="Collection (loading)" defaultOpen>
      <Combobox.Input placeholder="Fetching collections…" />
      <Combobox.Content loading />
    </Combobox>
  </div>
);

export const EmptyState: Story = () => (
  <div className="max-w-sm">
    <Combobox aria-label="Collection (empty)" defaultOpen>
      <Combobox.Input placeholder="Select a collection" />
      <Combobox.Content>
        <Combobox.Empty>No collections yet — ingest a document first.</Combobox.Empty>
      </Combobox.Content>
    </Combobox>
  </div>
);

/**
 * Query playground — a composição que os produtos theo-memory (recall) e
 * theo-rag (retrieval) montam: topK + threshold + collection picker.
 * Evidência executável do DoD bullet 3 do M1 (axe-validada em teste).
 */
export const QueryPlayground: Story = () => {
  const [collection, setCollection] = useState<string>();
  return (
    <form aria-label="Query playground" className="grid max-w-sm gap-6">
      <div className="grid gap-2">
        <span className="text-caption text-muted-foreground">Top K (1-100)</span>
        <Slider aria-label="Top K" min={1} max={100} defaultValue={[5]} marks={[{ value: 50 }]} />
      </div>
      <div className="grid gap-2">
        <span className="text-caption text-muted-foreground">Threshold (0-1)</span>
        <Slider aria-label="Threshold" min={0} max={1} step={0.05} defaultValue={[0.5]} />
      </div>
      <div className="grid gap-2">
        <span className="text-caption text-muted-foreground">Collection</span>
        <Combobox aria-label="Collection" value={collection} onValueChange={setCollection}>
          <Combobox.Input placeholder="Select a collection" />
          <Combobox.Content>
            <Combobox.Empty>No collections found.</Combobox.Empty>
            {collectionItems(COLLECTIONS)}
          </Combobox.Content>
        </Combobox>
      </div>
    </form>
  );
};
