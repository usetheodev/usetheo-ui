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

  it("test_validatefiles_multiple_false_rejects_all", () => {
    // F-tests-2: metade !multiple da regra coletiva
    const files = [file("a.pdf", "application/pdf"), file("b.pdf", "application/pdf")];
    const { accepted, rejections } = validateFiles(files, { multiple: false });
    expect(accepted).toHaveLength(0);
    expect(rejections).toHaveLength(2);
    expect(rejections[0]?.errors[0]?.code).toBe("too-many-files");
    expect(rejections[0]?.errors[0]?.message).toContain("1");
  });

  it("test_validatefiles_collective_rule_posthoc_preserves_perfile_errors", () => {
    // F-dom-2: fidelidade à referência — coletiva conta os ACEITOS pós-validação;
    // 4 files (2 inválidos) com maxFiles 3 → 2 aceitos + 2 rejeições de TIPO
    const files = [
      file("a.pdf", "application/pdf"),
      file("b.pdf", "application/pdf"),
      file("x.txt", "text/plain"),
      file("y.txt", "text/plain"),
    ];
    const { accepted, rejections } = validateFiles(files, { accept: PDF_ACCEPT, maxFiles: 3 });
    expect(accepted).toHaveLength(2);
    expect(rejections).toHaveLength(2);
    for (const r of rejections) {
      expect(r.errors[0]?.code).toBe("file-invalid-type");
    }
  });

  it("test_validatefiles_size_equal_to_min_accepts", () => {
    // F-tests-7: boundary exato do minSize (< estrito)
    const { accepted } = validateFiles([file("edge.pdf", "application/pdf", 10)], { minSize: 10 });
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

// ---- componente (T1.2) — fixture DnD portada da referência (spec:3553) ----

import { fireEvent, render } from "@testing-library/react";
import { createRef } from "react";
import { vi } from "vitest";
import { axe } from "vitest-axe";
import { FileDropzone } from "./file-dropzone.js";

function dtWithFiles(files: File[], types: string[] = ["Files"], emptyTypes = false) {
  return {
    dataTransfer: {
      files,
      items: files.map((f) => ({
        kind: "file",
        type: emptyTypes ? "" : f.type,
        // protected mode real: getAsFile() é null durante dragenter
        getAsFile: () => (emptyTypes ? null : f),
      })),
      types,
    },
  };
}

function renderZone(props: Record<string, unknown> = {}) {
  const result = render(<FileDropzone label="Upload documents" {...props} />);
  const root = result.container.querySelector('[data-slot="file-dropzone"]') as HTMLElement;
  const input = result.container.querySelector(
    '[data-slot="file-dropzone-input"]',
  ) as HTMLInputElement;
  return { ...result, root, input };
}

describe("FileDropzone — picker e teclado", () => {
  it("test_renders_label_and_default_instructions", () => {
    const { root, container } = renderZone();
    expect(root.getAttribute("aria-label")).toBe("Upload documents");
    expect(
      container.querySelector('[data-slot="file-dropzone-instructions"]')?.textContent,
    ).toBeTruthy();
  });

  it("test_root_is_keyboard_focusable_button", () => {
    const { root } = renderZone();
    expect(root.getAttribute("role")).toBe("button");
    expect(root.getAttribute("tabindex")).toBe("0");
  });

  it("test_enter_and_space_open_picker", () => {
    const { root, input } = renderZone();
    const click = vi.spyOn(input, "click").mockImplementation(() => {});
    fireEvent.keyDown(root, { key: "Enter" });
    fireEvent.keyDown(root, { key: " " });
    expect(click).toHaveBeenCalledTimes(2);
  });

  it("test_other_keys_do_not_open_picker", () => {
    const { root, input } = renderZone();
    const click = vi.spyOn(input, "click").mockImplementation(() => {});
    fireEvent.keyDown(root, { key: "a" });
    fireEvent.keyDown(root, { key: "Tab" });
    expect(click).not.toHaveBeenCalled();
  });

  it("test_keydown_on_descendant_does_not_open_picker", () => {
    const { container, input } = renderZone();
    const click = vi.spyOn(input, "click").mockImplementation(() => {});
    const inner = container.querySelector(
      '[data-slot="file-dropzone-instructions"]',
    ) as HTMLElement;
    fireEvent.keyDown(inner, { key: "Enter" });
    expect(click).not.toHaveBeenCalled();
  });

  it("test_disabled_removes_tab_stop_and_blocks_picker", () => {
    const { root, input } = renderZone({ disabled: true });
    const click = vi.spyOn(input, "click").mockImplementation(() => {});
    expect(root.getAttribute("tabindex")).not.toBe("0");
    expect(root.getAttribute("aria-disabled")).toBe("true");
    fireEvent.click(root);
    expect(click).not.toHaveBeenCalled();
    expect(root.getAttribute("data-state")).toBe("disabled");
  });

  it("test_input_is_visually_hidden_not_display_none", () => {
    const { input } = renderZone();
    expect(input.getAttribute("tabindex")).toBe("-1");
    expect(input.style.display).not.toBe("none");
    expect(input.className).toContain("sr-only");
  });

  it("test_click_opens_picker_with_value_reset", () => {
    const { root, input } = renderZone();
    let valueAtClickTime = "unset";
    const click = vi.spyOn(input, "click").mockImplementation(() => {
      valueAtClickTime = input.value;
    });
    Object.defineProperty(input, "value", { writable: true, value: "stale" });
    fireEvent.click(root);
    expect(valueAtClickTime).toBe("");
    expect(click).toHaveBeenCalledTimes(1);
  });

  it("test_change_event_flows_like_drop", () => {
    const onFilesAccepted = vi.fn();
    const { input } = renderZone({ onFilesAccepted });
    const f = file("r.pdf", "application/pdf");
    fireEvent.change(input, { target: { files: [f] } });
    expect(onFilesAccepted).toHaveBeenCalledWith([f]);
  });
});

describe("FileDropzone — drag & drop", () => {
  it("test_drop_accepted_calls_on_files_accepted", () => {
    const onFilesAccepted = vi.fn();
    const onFilesRejected = vi.fn();
    const { root } = renderZone({ onFilesAccepted, onFilesRejected, accept: PDF_ACCEPT });
    const f = file("r.pdf", "application/pdf");
    fireEvent.drop(root, dtWithFiles([f]));
    expect(onFilesAccepted).toHaveBeenCalledWith([f]);
    expect(onFilesRejected).not.toHaveBeenCalled();
  });

  it("test_drop_rejected_calls_on_files_rejected_with_typed_code", () => {
    const onFilesRejected = vi.fn();
    const { root, container } = renderZone({ onFilesRejected, accept: PDF_ACCEPT });
    fireEvent.drop(root, dtWithFiles([file("a.txt", "text/plain")]));
    const rejections = onFilesRejected.mock.calls[0]?.[0];
    expect(rejections[0]?.errors[0]?.code).toBe("file-invalid-type");
    const region = container.querySelector('[data-slot="file-dropzone-rejections"]');
    expect(region?.textContent).toContain("a.txt");
    expect(region?.textContent).toContain(".pdf");
  });

  it("test_dragenter_sets_drag_over_state", () => {
    const { root } = renderZone();
    fireEvent.dragEnter(root, dtWithFiles([file("r.pdf", "application/pdf")]));
    expect(root.getAttribute("data-state")).toBe("drag-over");
  });

  it("test_dragenter_with_invalid_type_sets_drag_reject", () => {
    const { root } = renderZone({ accept: PDF_ACCEPT });
    fireEvent.dragEnter(root, dtWithFiles([file("a.txt", "text/plain")]));
    expect(root.getAttribute("data-state")).toBe("drag-reject");
  });

  it("test_nested_dragleave_keeps_active", () => {
    const { root, container } = renderZone();
    const inner = container.querySelector(
      '[data-slot="file-dropzone-instructions"]',
    ) as HTMLElement;
    const data = dtWithFiles([file("r.pdf", "application/pdf")]);
    fireEvent.dragEnter(root, data);
    fireEvent.dragEnter(inner, data);
    fireEvent.dragLeave(inner, data);
    expect(root.getAttribute("data-state")).toBe("drag-over");
    fireEvent.dragLeave(root, data);
    expect(root.getAttribute("data-state")).toBe("idle");
  });

  it("test_non_file_drag_is_ignored", () => {
    const onFilesAccepted = vi.fn();
    const { root } = renderZone({ onFilesAccepted });
    fireEvent.dragEnter(root, { dataTransfer: { files: [], items: [], types: ["text/plain"] } });
    expect(root.getAttribute("data-state")).toBe("idle");
    fireEvent.drop(root, { dataTransfer: { files: [], items: [], types: ["text/plain"] } });
    expect(onFilesAccepted).not.toHaveBeenCalled();
  });

  it("test_dragenter_with_empty_item_type_stays_drag_over", () => {
    // F-dom-1 HIGH: drag real no Chrome — item type "" + getAsFile null NÃO pode virar drag-reject
    const { root } = renderZone({ accept: { "text/markdown": [".md"] } });
    fireEvent.dragEnter(root, dtWithFiles([file("notes.md", "text/markdown")], ["Files"], true));
    expect(root.getAttribute("data-state")).toBe("drag-over");
  });

  it("test_double_dragenter_same_target_balanced_by_double_dragleave", () => {
    // F-tests-3: double-fire do Firefox no MESMO elemento
    const { root } = renderZone();
    const data = dtWithFiles([file("r.pdf", "application/pdf")]);
    fireEvent.dragEnter(root, data);
    fireEvent.dragEnter(root, data);
    fireEvent.dragLeave(root, data);
    expect(root.getAttribute("data-state")).toBe("drag-over");
    fireEvent.dragLeave(root, data);
    expect(root.getAttribute("data-state")).toBe("idle");
  });

  it("test_change_with_invalid_file_rejects_with_typed_code", () => {
    // F-tests-1: o caminho do picker passa pela MESMA validação do drop
    const onFilesAccepted = vi.fn();
    const onFilesRejected = vi.fn();
    const { input, container } = renderZone({
      onFilesAccepted,
      onFilesRejected,
      accept: PDF_ACCEPT,
    });
    fireEvent.change(input, { target: { files: [file("a.txt", "text/plain")] } });
    expect(onFilesRejected.mock.calls[0]?.[0]?.[0]?.errors[0]?.code).toBe("file-invalid-type");
    expect(onFilesAccepted).not.toHaveBeenCalled();
    expect(container.querySelector('[data-slot="file-dropzone-rejections"]')).not.toBeNull();
  });

  it("test_disabled_ignores_drag_and_drop", () => {
    // F-tests-5: handlers inertes quando disabled
    const onFilesAccepted = vi.fn();
    const { root } = renderZone({ disabled: true, onFilesAccepted });
    const data = dtWithFiles([file("r.pdf", "application/pdf")]);
    fireEvent.dragEnter(root, data);
    expect(root.getAttribute("data-state")).toBe("disabled");
    fireEvent.drop(root, data);
    expect(onFilesAccepted).not.toHaveBeenCalled();
  });

  it("test_empty_file_list_triggers_no_callbacks", () => {
    const onFilesAccepted = vi.fn();
    const onFilesRejected = vi.fn();
    const { input } = renderZone({ onFilesAccepted, onFilesRejected });
    fireEvent.change(input, { target: { files: [] } });
    expect(onFilesAccepted).not.toHaveBeenCalled();
    expect(onFilesRejected).not.toHaveBeenCalled();
  });
});

describe("FileDropzone — wiring & a11y", () => {
  it("test_all_parts_have_data_slot_and_forwards_ref", () => {
    const ref = createRef<HTMLDivElement>();
    const { container } = render(<FileDropzone ref={ref} label="P" />);
    for (const slot of ["file-dropzone", "file-dropzone-input", "file-dropzone-instructions"]) {
      expect(container.querySelectorAll(`[data-slot="${slot}"]`).length).toBeGreaterThan(0);
    }
    expect(ref.current?.getAttribute("data-slot")).toBe("file-dropzone");
  });

  it("test_axe_no_violations", async () => {
    const rejected = renderZone({ accept: PDF_ACCEPT });
    fireEvent.drop(rejected.root, dtWithFiles([file("a.txt", "text/plain")]));
    const { container } = render(
      <div>
        <FileDropzone label="Idle" />
        <FileDropzone label="Disabled" disabled />
      </div>,
    );
    expect(await axe(container)).toHaveNoViolations();
    expect(await axe(rejected.container)).toHaveNoViolations();
  });
});

describe("FileDropzone — story smoke", () => {
  it("test_ingest_upload_story_renders_dropzone_with_progress", async () => {
    const { IngestUpload } = await import("./file-dropzone.stories.js");
    const { container } = render(<IngestUpload />);
    expect(container.querySelectorAll('[data-slot="file-dropzone"]')).toHaveLength(1);
    expect(container.querySelector('[role="progressbar"]')).not.toBeNull();
  });
});

describe("FileDropzone — barrel", () => {
  it("test_barrel_exports_file_dropzone", async () => {
    const barrel = await import("../../../index.js");
    expect(barrel.FileDropzone).toBe(FileDropzone);
    expect(barrel.matchesAccept).toBe(matchesAccept);
    expect(barrel.validateFiles).toBe(validateFiles);
  });
});
