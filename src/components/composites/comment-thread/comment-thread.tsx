import { forwardRef, useId, useState } from "react";
import { cn } from "../../../lib/cn.js";
import { Avatar } from "../../primitives/avatar/index.js";
import { Button } from "../../primitives/button/index.js";
import { Textarea } from "../../primitives/textarea/index.js";
import { Timestamp } from "../../primitives/timestamp/index.js";

/**
 * A single comment in a {@link CommentThread}. The `id` keys the list; the
 * consumer owns id assignment (backend or fixture).
 */
export interface Comment {
  id: string;
  author: string;
  body: string;
  /** ISO string OR Unix **ms** (Timestamp contract) — NOT seconds. */
  createdAt: string | number;
  avatarUrl?: string;
}

export interface CommentThreadProps {
  /** The rendered thread (controlled — the consumer brings/persists it). */
  comments: Comment[];
  /** Called with the trimmed draft when the composer submits a non-empty body. */
  onSubmit: (body: string) => void;
  /** Name of the person composing — surfaced as the composer avatar/context. */
  currentUser?: string;
  disabled?: boolean;
  className?: string;
}

/**
 * CommentThread — controlled comment thread + composer (M17).
 *
 * Renders an ordered `<ol>` of comments (`Avatar` + author + `Timestamp` +
 * body) followed by a composer (`Textarea` + submit `Button`). The LIST is
 * controlled via `comments`; only the composer draft is local state. A
 * non-empty (trimmed) body calls `onSubmit(body)` and clears the draft;
 * empty/whitespace never submits. No comments → an honest empty state, but
 * the composer still shows. Composes DS primitives — zero new dependency.
 *
 *   <CommentThread comments={comments} onSubmit={postComment} />
 */
function initialOf(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

const CommentThread = forwardRef<HTMLDivElement, CommentThreadProps>(
  ({ comments, onSubmit, currentUser, disabled, className }, ref) => {
    const [draft, setDraft] = useState("");
    const composerId = useId();

    const submit = () => {
      const body = draft.trim();
      if (body === "" || disabled) return;
      onSubmit(body);
      setDraft("");
    };

    return (
      <div data-slot="comment-thread" ref={ref} className={cn("flex flex-col gap-4", className)}>
        {comments.length === 0 ? (
          <p data-slot="comment-thread-empty" className="text-body-sm text-muted-foreground">
            No comments yet.
          </p>
        ) : (
          <ol className="flex flex-col gap-4">
            {comments.map((c) => (
              <li key={c.id} data-slot="comment-thread-item" className="flex gap-3">
                <Avatar size="sm">
                  {c.avatarUrl ? <Avatar.Image src={c.avatarUrl} alt={c.author} /> : null}
                  <Avatar.Fallback delayMs={0}>{initialOf(c.author)}</Avatar.Fallback>
                </Avatar>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-body-sm text-foreground">{c.author}</span>
                    <Timestamp value={c.createdAt} className="text-label text-muted-foreground" />
                  </div>
                  <p className="whitespace-pre-wrap break-words text-body-sm text-foreground">
                    {c.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
        <div data-slot="comment-thread-composer" className="flex flex-col gap-2">
          <label htmlFor={composerId} className="sr-only">
            Add a comment
          </label>
          <Textarea
            id={composerId}
            value={draft}
            disabled={disabled}
            placeholder={currentUser ? `Comment as ${currentUser}…` : "Add a comment…"}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className="flex justify-end">
            <Button type="button" size="sm" disabled={disabled} onClick={submit}>
              Comment
            </Button>
          </div>
        </div>
      </div>
    );
  },
);
CommentThread.displayName = "CommentThread";

export { CommentThread };
