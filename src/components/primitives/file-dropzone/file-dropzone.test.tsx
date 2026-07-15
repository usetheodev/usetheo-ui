import { describe, expect, it } from "vitest";
import { matchesAccept, validateFiles } from "./file-dropzone.js";

const file = (name: string, type: string, size = 100): File => {
  const f = new File([], name, { type });
  Object.defineProperty(f, "size", { value: size });
  return f;
};

const PDF_ACCEPT = { "application/pdf": [".pdf"] };

describe("matchesAccept — pure helper", () => {
  it("test_matchesaccept_empty_accept_accepts_all", () => {
    expect(matchesAccept(file("a.bin", "application/octet-stream"))).toBe(true);
    expect(matchesAccept(file("a.bin", "application/octet-stream"), {})).toBe(true);
  });

  it("test_matchesaccept_exact_mime", () => {
    expect(matchesAccept(file("r.pdf", "application/pdf"), PDF_ACCEPT)).toBe(true);
  });

  it("test_matchesaccept_wildcard_mime", () => {
    expect(matchesAccept(file("p.png", "image/png"), { "image/*": [] })).toBe(true);
  });

  it("test_matchesaccept_extension_case_insensitive", () => {
    expect(matchesAccept(file("REPORT.PDF", ""), PDF_ACCEPT)).toBe(true);
  });

  it("test_matchesaccept_empty_type_accepted_during_drag", () => {
    // quirk Chrome: type "" durante o drag (ex.: .md) — aceita; valida no drop
    expect(matchesAccept(file("notes.md", ""), { "text/markdown": [".md"] })).toBe(true);
  });

  it("test_matchesaccept_rejects_wrong_type", () => {
    expect(matchesAccept(file("a.txt", "text/plain"), PDF_ACCEPT)).toBe(false);
  });
});

describe("validateFiles — pure helper", () => {
  it("test_validatefiles_accepts_valid_file", () => {
    const { accepted, rejections } = validateFiles([file("r.pdf", "application/pdf")], {
      accept: PDF_ACCEPT,
    });
    expect(accepted).toHaveLength(1);
    expect(rejections).toHaveLength(0);
  });

  it("test_validatefiles_too_large_typed_error", () => {
    const { rejections } = validateFiles([file("big.pdf", "application/pdf", 200)], {
      accept: PDF_ACCEPT,
      maxSize: 150,
    });
    expect(rejections[0]?.errors[0]?.code).toBe("file-too-large");
    expect(rejections[0]?.errors[0]?.message).toContain("150");
  });

  it("test_validatefiles_too_small_typed_error", () => {
    const { rejections } = validateFiles([file("tiny.pdf", "application/pdf", 5)], {
      minSize: 10,
    });
    expect(rejections[0]?.errors[0]?.code).toBe("file-too-small");
  });

  it("test_validatefiles_invalid_type_typed_error", () => {
    const { rejections } = validateFiles([file("a.txt", "text/plain")], { accept: PDF_ACCEPT });
    expect(rejections[0]?.errors[0]?.code).toBe("file-invalid-type");
    expect(rejections[0]?.errors[0]?.message).toContain(".pdf");
  });

  it("test_validatefiles_maxfiles_rejects_all", () => {
    const files = [
      file("a.pdf", "application/pdf"),
      file("b.pdf", "application/pdf"),
      file("c.pdf", "application/pdf"),
    ];
    const { accepted, rejections } = validateFiles(files, { maxFiles: 2 });
    expect(accepted).toHaveLength(0);
    expect(rejections).toHaveLength(3);
    for (const r of rejections) {
      expect(r.errors.some((e) => e.code === "too-many-files")).toBe(true);
    }
  });

  it("test_validatefiles_maxfiles_exact_boundary_accepts", () => {
    const files = [file("a.pdf", "application/pdf"), file("b.pdf", "application/pdf")];
    const { accepted, rejections } = validateFiles(files, { maxFiles: 2 });
    expect(accepted).toHaveLength(2);
    expect(rejections).toHaveLength(0);
  });

  it("test_validatefiles_size_equal_to_max_accepts", () => {
    const { accepted } = validateFiles([file("edge.pdf", "application/pdf", 150)], {
      maxSize: 150,
    });
    expect(accepted).toHaveLength(1);
  });

  it("test_validatefiles_custom_validator_accumulates", () => {
    const { rejections } = validateFiles([file("big.pdf", "application/pdf", 200)], {
      maxSize: 150,
      validator: () => ({ code: "quota-exceeded", message: "Workspace quota exceeded" }),
    });
    const codes = rejections[0]?.errors.map((e) => e.code);
    expect(codes).toContain("file-too-large");
    expect(codes).toContain("quota-exceeded");
  });
});
