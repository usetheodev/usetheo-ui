import type { Story } from "@ladle/react";
import { useState } from "react";
import { Progress } from "../progress/index.js";
import type { FileRejection } from "./file-dropzone.js";
import { FileDropzone } from "./file-dropzone.js";

export default {
  title: "Primitives / Forms / FileDropzone",
};

/**
 * Accept from the real case (theo-rag ingest — the canonical mime-from-name map):
 * pdf, docx/pptx/xlsx, csv, txt/md/html and png/jpg images.
 *
 * Cross-browser manual verification matrix (ROADMAP § M5, risk #2):
 * - Chrome: dragging a .md reports type "" during the drag (accepted; validated on drop)
 * - Firefox: dragenter/dragleave double-fire on the same element (target counting covers it)
 * - Safari: dropEffect can throw on a protected dataTransfer (the try/catch covers it)
 */
const INGEST_ACCEPT: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "text/csv": [".csv"],
  "text/plain": [".txt"],
  "text/markdown": [".md", ".markdown"],
  "text/html": [".html", ".htm"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"],
};

/** The theo-rag case: document ingest + composition with Progress (DoD b2). */
export const IngestUpload: Story = () => {
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <div className="max-w-md space-y-3">
      <FileDropzone
        label="Upload documents for ingestion"
        accept={INGEST_ACCEPT}
        maxSize={25 * 1024 * 1024}
        onFilesAccepted={(files) => setSelected(files.map((f) => f.name))}
      />
      {/* an upload in progress is the consumer's responsibility — this demo is static */}
      <div className="space-y-1">
        <p className="text-label text-muted-foreground">
          {selected.length > 0 ? `Ingesting ${selected.join(", ")}` : "Ingesting report.pdf"}
        </p>
        <Progress value={62} aria-label="Upload progress" />
      </div>
    </div>
  );
};

/** An invalid drop → the typed-rejection region becomes visible. */
export const Rejected: Story = () => {
  const [rejections, setRejections] = useState<FileRejection[]>([]);
  return (
    <div className="max-w-md space-y-2">
      <FileDropzone
        label="PDF only"
        accept={{ "application/pdf": [".pdf"] }}
        onFilesRejected={setRejections}
      />
      <p className="text-label text-muted-foreground">
        {rejections.length > 0
          ? `${rejections.length} file(s) rejected — codes: ${rejections
              .flatMap((r) => r.errors.map((e) => e.code))
              .join(", ")}`
          : "Drag a .txt in to see the typed rejection."}
      </p>
    </div>
  );
};

/** Several files against a limit — the all-or-nothing collective rule. */
export const MultiFile: Story = () => (
  <div className="max-w-md">
    <FileDropzone
      label="Up to 3 files"
      maxFiles={3}
      instructions="Drop up to 3 files (4+ rejects them all — too-many-files)."
    />
  </div>
);

export const Disabled: Story = () => (
  <div className="max-w-md">
    <FileDropzone label="Uploads paused" disabled />
  </div>
);
