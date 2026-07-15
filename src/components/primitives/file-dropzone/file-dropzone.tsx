/**
 * FileDropzone — drag-drop + file-picker primitive, dependency-free (HTML5
 * DnD). The drag mechanics, the typed-rejection shape and the browser quirks
 * are ported from the react-dropzone reference study (blueprint M5): nested
 * dragenter/dragleave target counting, empty MIME type during drag (Chrome),
 * and the all-or-nothing maxFiles rule.
 *
 * Boundary: this component SELECTS and VALIDATES files. Uploading (network,
 * progress) belongs to the consumer — compose with `Progress` for that.
 * Directory drops are out of scope (entries without a real File are skipped).
 */

import { forwardRef, useRef, useState } from "react";
import type { DragEvent, HTMLAttributes, KeyboardEvent, ReactNode } from "react";
import { cn } from "../../../lib/cn.js";
import { matchesAccept, validateFiles } from "./validate.js";
import type { FileRejection, ValidateFilesOptions } from "./validate.js";

export {
  matchesAccept,
  validateFiles,
  type FileDropzoneError,
  type FileDropzoneErrorCode,
  type FileRejection,
  type ValidateFilesOptions,
} from "./validate.js";

export type FileDropzoneState = "idle" | "drag-over" | "drag-reject" | "disabled";

export interface FileDropzoneProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "onDrop" | "children">,
    ValidateFilesOptions {
  /** Accessible name for the dropzone (aria-label). */
  label: string;
  disabled?: boolean;
  onFilesAccepted?: (files: File[]) => void;
  onFilesRejected?: (rejections: FileRejection[]) => void;
  /** Custom instructions content; defaults to a drag-or-click hint. */
  instructions?: ReactNode;
}

function hasFiles(event: DragEvent): boolean {
  return Array.from(event.dataTransfer?.types ?? []).includes("Files");
}

const FileDropzone = forwardRef<HTMLDivElement, FileDropzoneProps>(
  (
    {
      label,
      disabled = false,
      accept,
      maxSize,
      minSize,
      maxFiles,
      multiple = true,
      validator,
      onFilesAccepted,
      onFilesRejected,
      instructions,
      className,
      ...props
    },
    ref,
  ) => {
    // Target counting (ported): dragenter pushes, dragleave removes ONCE,
    // deactivate only when empty — survives nested children and the Firefox
    // dragenter/dragleave double-fire.
    const dragTargetsRef = useRef<EventTarget[]>([]);
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragState, setDragState] = useState<"idle" | "drag-over" | "drag-reject">("idle");
    const [rejections, setRejections] = useState<FileRejection[]>([]);

    // prettier-ignore — kept on one line: mirrors the destructured props 1:1
    const validateOptions: ValidateFilesOptions = {
      accept,
      maxSize,
      minSize,
      maxFiles,
      multiple,
      validator,
    };

    const processFiles = (files: File[]) => {
      if (files.length === 0) return;
      const result = validateFiles(files, validateOptions);
      setRejections(result.rejections);
      if (result.accepted.length > 0) onFilesAccepted?.(result.accepted);
      if (result.rejections.length > 0) onFilesRejected?.(result.rejections);
    };

    const openPicker = () => {
      const input = inputRef.current;
      if (!input || disabled) return;
      input.value = "";
      input.click();
    };

    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.target !== event.currentTarget) return;
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openPicker();
      }
    };

    const onDragEnter = (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (disabled || !hasFiles(event)) return;
      dragTargetsRef.current = [...dragTargetsRef.current, event.target];
      // Validate DURING drag: items expose {kind, type} but not size/name in
      // real browsers, so only the type gate can fire here.
      const items = Array.from(event.dataTransfer?.items ?? []).filter(
        (item) => item.kind === "file",
      );
      const reject =
        accept !== undefined &&
        items.length > 0 &&
        items.some(
          (item) =>
            !matchesAccept(
              new File([], item.getAsFile?.()?.name ?? "", { type: item.type }),
              accept,
            ),
        );
      setDragState(reject ? "drag-reject" : "drag-over");
    };

    const onDragOver = (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      if (event.dataTransfer) {
        try {
          event.dataTransfer.dropEffect = "copy";
        } catch {
          // some browsers throw on protected dataTransfer — visual nicety only
        }
      }
    };

    const onDragLeave = (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const root = event.currentTarget;
      const targets = dragTargetsRef.current.filter((t) => root.contains(t as Node));
      const idx = targets.indexOf(event.target);
      if (idx !== -1) targets.splice(idx, 1);
      dragTargetsRef.current = targets;
      if (targets.length === 0) setDragState("idle");
    };

    const onDrop = (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      dragTargetsRef.current = [];
      setDragState("idle");
      if (disabled || !hasFiles(event)) return;
      processFiles(Array.from(event.dataTransfer?.files ?? []));
    };

    const state: FileDropzoneState = disabled ? "disabled" : dragState;

    return (
      <div className="space-y-2">
        {/* div+role=button (não <button> nativo): a superfície de drop hospeda conteúdo
            em bloco e estados visuais de drag; o contrato completo de teclado/ARIA de botão
            está implementado acima. Regra desligada só para este arquivo em biome.json. */}
        <div
          data-slot="file-dropzone"
          data-state={state}
          ref={ref}
          role="button"
          aria-label={label}
          aria-disabled={disabled || undefined}
          tabIndex={disabled ? undefined : 0}
          onClick={() => openPicker()}
          onKeyDown={onKeyDown}
          onDragEnter={onDragEnter}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          className={cn(
            "flex min-h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-border border-dashed p-4 text-center",
            state === "drag-over" && "border-primary bg-primary/5",
            state === "drag-reject" && "border-destructive bg-destructive/5",
            state === "disabled" && "cursor-not-allowed opacity-50",
            className,
          )}
          {...props}
        >
          <div
            data-slot="file-dropzone-instructions"
            className="text-body-sm text-muted-foreground"
          >
            {instructions ?? "Drag files here or click to browse."}
          </div>
        </div>
        {/* Outside the role="button" surface — nesting interactive controls is
            an axe violation; the picker is driven programmatically via ref. */}
        <input
          data-slot="file-dropzone-input"
          ref={inputRef}
          type="file"
          aria-label={label}
          tabIndex={-1}
          multiple={multiple}
          accept={
            accept
              ? Object.entries(accept)
                  .flatMap(([m, e]) => [m, ...e])
                  .join(",")
              : undefined
          }
          disabled={disabled}
          className="sr-only"
          onChange={(event) => processFiles(Array.from(event.target.files ?? []))}
        />
        {rejections.length > 0 && (
          <ul
            data-slot="file-dropzone-rejections"
            className="space-y-0.5 text-destructive text-label"
          >
            {rejections.map((r) => (
              <li key={r.file.name}>
                {r.file.name} — {r.errors.map((e) => e.message).join("; ")}
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  },
);
FileDropzone.displayName = "FileDropzone";

export { FileDropzone };
