"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { addComment, deleteComment, toggleCommentLike } from "@/lib/actions/comments";

export interface CommentItem {
  id: string;
  authorId: string;
  authorName: string;
  body: string;
  likeCount: number;
  likedByMe: boolean;
}

function CommentLikeButton({
  commentId,
  initialCount,
  initialLiked,
}: {
  commentId: string;
  initialCount: number;
  initialLiked: boolean;
}) {
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(initialLiked);
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    if (isPending) return;
    const prevLiked = liked;
    const nextLiked = !liked;
    setLiked(nextLiked);
    setCount((c) => c + (nextLiked ? 1 : -1));

    startTransition(async () => {
      const result = await toggleCommentLike(commentId);
      if (result.error) {
        setLiked(prevLiked);
        setCount((c) => c - (nextLiked ? 1 : -1));
      } else if (result.liked !== nextLiked) {
        setLiked(result.liked);
        setCount((c) => c + (result.liked ? 1 : -1) - (nextLiked ? 1 : -1));
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`ml-2 inline-flex items-center gap-0.5 text-xs transition ${
        liked ? "text-sunset-600" : "text-stone-400 hover:text-sunset-500"
      }`}
    >
      <Heart className={`h-3 w-3 ${liked ? "fill-sunset-500 text-sunset-500" : ""}`} aria-hidden="true" />
      {count > 0 && count}
    </button>
  );
}

export function CommentSection({
  activityKey,
  initialComments,
  currentUserId,
  currentUserName,
}: {
  activityKey: string;
  initialComments: CommentItem[];
  currentUserId: string | null;
  currentUserName: string | null;
}) {
  const [comments, setComments] = useState(initialComments);
  const [text, setText] = useState("");
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const body = text.trim();
    if (!body || !currentUserId) return;
    setError(null);

    const optimisticId = `temp-${Date.now()}`;
    setComments((c) => [
      ...c,
      {
        id: optimisticId,
        authorId: currentUserId,
        authorName: currentUserName ?? "You",
        body,
        likeCount: 0,
        likedByMe: false,
      },
    ]);
    setText("");

    startTransition(async () => {
      const result = await addComment(activityKey, body);
      if (result.error) {
        setError(result.error);
        setComments((c) => c.filter((cm) => cm.id !== optimisticId));
      }
    });
  }

  function handleDelete(id: string) {
    setComments((c) => c.filter((cm) => cm.id !== id));
    startTransition(async () => {
      await deleteComment(id);
    });
  }

  return (
    <div className="mt-3 border-t border-stone-100 pt-3">
      {comments.length > 0 && (
        <ul className="space-y-1.5">
          {comments.map((c) => {
            const isTemp = c.id.startsWith("temp-");
            return (
              <li key={c.id} className="text-sm">
                <span className="font-medium text-stone-900">{c.authorName}</span>{" "}
                <span className="text-stone-600">{c.body}</span>
                {!isTemp && (
                  <CommentLikeButton
                    commentId={c.id}
                    initialCount={c.likeCount}
                    initialLiked={c.likedByMe}
                  />
                )}
                {currentUserId === c.authorId && !isTemp && (
                  <button
                    type="button"
                    onClick={() => handleDelete(c.id)}
                    className="ml-2 text-xs text-stone-400 hover:text-red-600"
                  >
                    Delete
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {currentUserId ? (
        <form onSubmit={handleSubmit} className="mt-2 flex gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment..."
            maxLength={500}
            className="input flex-1 py-1.5 text-sm"
          />
          <button
            type="submit"
            disabled={isPending || !text.trim()}
            className="btn-secondary px-3 py-1.5 text-sm"
          >
            Post
          </button>
        </form>
      ) : (
        <p className="mt-2 text-xs text-stone-400">
          <a href="/login" className="text-brand-700 hover:underline">
            Log in
          </a>{" "}
          to comment.
        </p>
      )}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}
