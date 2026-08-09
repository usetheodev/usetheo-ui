import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import { CommentThread as CommentThreadFromBarrel } from "../../../index.js";
import { CommentThread } from "./comment-thread.js";
import type { Comment } from "./comment-thread.js";

const COMMENTS: Comment[] = [
  { id: "1", author: "Ada", body: "First look at the trace.", createdAt: "2026-07-10T10:00:00Z" },
  { id: "2", author: "Alan", body: "Latency looks high here.", createdAt: 1_720_000_000_000 },
];

describe("CommentThread", () => {
  it("renders one item per comment", () => {
    render(<CommentThread comments={COMMENTS} onSubmit={() => {}} />);
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("First look at the trace.")).toBeInTheDocument();
    expect(screen.getByText("Latency looks high here.")).toBeInTheDocument();
    expect(screen.getByText("Ada")).toBeInTheDocument();
  });

  it("submit emits the trimmed body", () => {
    const onSubmit = vi.fn();
    render(<CommentThread comments={COMMENTS} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText(/add a comment/i), {
      target: { value: "  looks good  " },
    });
    fireEvent.click(screen.getByRole("button", { name: /comment|submit/i }));
    expect(onSubmit).toHaveBeenCalledWith("looks good");
  });

  it("an empty body does not submit", () => {
    const onSubmit = vi.fn();
    render(<CommentThread comments={COMMENTS} onSubmit={onSubmit} />);
    fireEvent.click(screen.getByRole("button", { name: /comment|submit/i }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("a whitespace-only body does not submit", () => {
    const onSubmit = vi.fn();
    render(<CommentThread comments={COMMENTS} onSubmit={onSubmit} />);
    fireEvent.change(screen.getByLabelText(/add a comment/i), { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: /comment|submit/i }));
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("the composer clears after submit", () => {
    render(<CommentThread comments={COMMENTS} onSubmit={() => {}} />);
    const ta = screen.getByLabelText(/add a comment/i) as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: "nice" } });
    fireEvent.click(screen.getByRole("button", { name: /comment|submit/i }));
    expect(ta.value).toBe("");
  });

  it("with no comments it shows an honest empty state plus the composer", () => {
    const { container } = render(<CommentThread comments={[]} onSubmit={() => {}} />);
    expect(container.querySelector('[data-slot="comment-thread-empty"]')).not.toBeNull();
    // composer still present
    expect(screen.getByLabelText(/add a comment/i)).toBeInTheDocument();
  });

  it("disabled disables the composer", () => {
    const onSubmit = vi.fn();
    render(<CommentThread comments={COMMENTS} onSubmit={onSubmit} disabled />);
    expect(screen.getByLabelText(/add a comment/i)).toBeDisabled();
    expect(screen.getByRole("button", { name: /comment|submit/i })).toBeDisabled();
  });

  it("expõe data-slot no root e ref", () => {
    const ref = { current: null as HTMLDivElement | null };
    const { container } = render(
      <CommentThread ref={ref} comments={COMMENTS} onSubmit={() => {}} />,
    );
    const root = container.querySelector('[data-slot="comment-thread"]');
    expect(root).not.toBeNull();
    expect(ref.current).toBe(root);
  });

  it("is exported from the root barrel", () => {
    expect(CommentThreadFromBarrel).toBe(CommentThread);
  });

  it("no axe violations — with comments", async () => {
    const { container } = render(<CommentThread comments={COMMENTS} onSubmit={() => {}} />);
    expect(await axe(container)).toHaveNoViolations();
  });

  it("no axe violations — empty state", async () => {
    const { container } = render(<CommentThread comments={[]} onSubmit={() => {}} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
