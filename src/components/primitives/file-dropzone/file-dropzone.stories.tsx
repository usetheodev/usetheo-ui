import type { Story } from "@ladle/react";
import { useState } from "react";
import { Progress } from "../progress/index.js";
import type { FileRejection } from "./file-dropzone.js";
import { FileDropzone } from "./file-dropzone.js";

export default {
  title: "Primitives / Forms / FileDropzone",
};

/**
 * Accept do caso real (theo-rag ingest — mapa canônico do mime-from-name):
 * pdf, docx/pptx/xlsx, csv, txt/md/html e imagens png/jpg.
 *
 * Matriz de verificação manual cross-browser (risco #2 do ROADMAP § M5):
 * - Chrome: drag de .md reporta type "" durante o drag (aceito; valida no drop)
 * - Firefox: dragenter/dragleave double-fire no mesmo elemento (target counting cobre)
 * - Safari: dropEffect pode lançar em dataTransfer protegido (try/catch cobre)
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

/** Caso theo-rag: ingest de documentos + composição com Progress (DoD b2). */
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
      {/* upload em andamento é responsabilidade do consumidor — demo estática */}
      <div className="space-y-1">
        <p className="text-label text-muted-foreground">
          {selected.length > 0 ? `Ingesting ${selected.join(", ")}` : "Ingesting report.pdf"}
        </p>
        <Progress value={62} aria-label="Upload progress" />
      </div>
    </div>
  );
};

/** Drop inválido → região de rejeições tipadas visível. */
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
          ? `${rejections.length} arquivo(s) rejeitado(s) — códigos: ${rejections
              .flatMap((r) => r.errors.map((e) => e.code))
              .join(", ")}`
          : "Arraste um .txt para ver a rejeição tipada."}
      </p>
    </div>
  );
};

/** Vários arquivos com limite — regra coletiva tudo-ou-nada. */
export const MultiFile: Story = () => (
  <div className="max-w-md">
    <FileDropzone
      label="Up to 3 files"
      maxFiles={3}
      instructions="Solte até 3 arquivos (4+ rejeita todos — too-many-files)."
    />
  </div>
);

export const Disabled: Story = () => (
  <div className="max-w-md">
    <FileDropzone label="Uploads paused" disabled />
  </div>
);
