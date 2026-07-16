import type { Story } from "@ladle/react";
import { useState } from "react";
import { CommentThread } from "./comment-thread.js";
import type { Comment } from "./comment-thread.js";

export default {
  title: "Composites / Collaboration / CommentThread",
};

const SEED: Comment[] = [
  {
    id: "1",
    author: "Ada Lovelace",
    body: "First pass through the trace — the retrieval step dominates latency.",
    createdAt: Date.now() - 1000 * 60 * 60 * 3,
  },
  {
    id: "2",
    author: "Alan Turing",
    body: "Agreed. Let's cache the embeddings and re-measure.",
    createdAt: Date.now() - 1000 * 60 * 30,
  },
];

/**
 * Thread controlado (comments + onSubmit) com composer local: submeter um body
 * não-vazio adiciona um comentário e limpa o textarea. O caso sem comentários
 * mostra o empty honesto e mantém o composer.
 */
export const Playground: Story = () => {
  const [comments, setComments] = useState<Comment[]>(SEED);
  const add = (body: string) =>
    setComments((prev) => [
      ...prev,
      { id: String(prev.length + 1), author: "You", body, createdAt: Date.now() },
    ]);
  return (
    <div className="max-w-lg space-y-8">
      <CommentThread comments={comments} onSubmit={add} currentUser="You" />
      <div className="border-border/40 border-t pt-6">
        <p className="mb-2 text-body-sm text-muted-foreground">Empty state:</p>
        <CommentThread comments={[]} onSubmit={() => {}} />
      </div>
    </div>
  );
};
