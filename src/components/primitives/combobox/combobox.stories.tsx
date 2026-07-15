import type { Story } from "@ladle/react";
import { useMemo, useState } from "react";
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
