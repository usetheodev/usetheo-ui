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

export type FileDropzoneErrorCode =
  | "file-invalid-type"
  | "file-too-large"
  | "file-too-small"
  | "too-many-files";

export interface FileDropzoneError {
  /** One of the four built-in codes, or a custom code from `validator`. */
  code: FileDropzoneErrorCode | string;
  message: string;
}

export interface FileRejection {
  file: File;
  errors: FileDropzoneError[];
}

export interface ValidateFilesOptions {
  accept?: Record<string, string[]>;
  maxSize?: number;
  minSize?: number;
  maxFiles?: number;
  multiple?: boolean;
  validator?: (file: File) => FileDropzoneError | FileDropzoneError[] | null;
}

// ---- pure helpers (exported for unit tests and consumer reuse) ----

/**
 * Matches a file against an `accept` map ({mime: [ext...]}): exact MIME,
 * `type/*` wildcard, or extension (case-insensitive). No accept → accepts
 * everything. An empty `file.type` is accepted (Chrome reports "" for some
 * types during drag) — real validation happens again on drop.
 */
export function matchesAccept(file: File, accept?: Record<string, string[]>): boolean {
  const entries = Object.entries(accept ?? {});
  if (entries.length === 0) return true;
  if (file.type === "") {
    // Chrome reports "" for some types during drag — fall back to extension;
    // with no declared extensions there is no way to tell, so accept.
    const exts = entries.flatMap(([, e]) => e);
    if (exts.length === 0) return true;
    return exts.some((ext) => file.name.toLowerCase().endsWith(ext.toLowerCase()));
  }
  return entries.some(([mime, exts]) => {
    if (mime === file.type) return true;
    if (mime.endsWith("/*") && file.type.startsWith(mime.slice(0, -1))) return true;
    return exts.some((ext) => file.name.toLowerCase().endsWith(ext.toLowerCase()));
  });
}

function acceptedExtensions(accept: Record<string, string[]>): string {
  const exts = Object.values(accept).flat();
  return exts.length > 0 ? exts.join(", ") : Object.keys(accept).join(", ");
}

/**
 * Validates files against accept/size/count rules plus an optional custom
 * validator. Per-file errors accumulate; the maxFiles/multiple rule is
 * COLLECTIVE and all-or-nothing: exceeding it rejects EVERY file with
 * `too-many-files` (ported from the reference behavior).
 */
export function validateFiles(
  files: File[],
  options: ValidateFilesOptions = {},
): { accepted: File[]; rejections: FileRejection[] } {
  const { accept, maxSize, minSize, maxFiles, multiple = true, validator } = options;

  const tooMany =
    (!multiple && files.length > 1) ||
    (maxFiles !== undefined && maxFiles >= 1 && files.length > maxFiles);
  if (tooMany) {
    const limit = !multiple ? 1 : maxFiles;
    return {
      accepted: [],
      rejections: files.map((file) => ({
        file,
        errors: [
          {
            code: "too-many-files",
            message: `Too many files — at most ${limit} allowed`,
          },
        ],
      })),
    };
  }

  const accepted: File[] = [];
  const rejections: FileRejection[] = [];
  for (const file of files) {
    const errors: FileDropzoneError[] = [];
    if (accept && !matchesAccept(file, accept)) {
      errors.push({
        code: "file-invalid-type",
        message: `File type must be one of ${acceptedExtensions(accept)}`,
      });
    }
    if (maxSize !== undefined && file.size > maxSize) {
      errors.push({ code: "file-too-large", message: `File is larger than ${maxSize} bytes` });
    }
    if (minSize !== undefined && file.size < minSize) {
      errors.push({ code: "file-too-small", message: `File is smaller than ${minSize} bytes` });
    }
    const custom = validator?.(file);
    if (custom) errors.push(...(Array.isArray(custom) ? custom : [custom]));

    if (errors.length > 0) {
      rejections.push({ file, errors });
    } else {
      accepted.push(file);
    }
  }
  return { accepted, rejections };
}
