"use client";

import { useEffect, useState } from "react";

interface BlogComment {
  id: string;
  authorName: string;
  body: string;
  createdAt: string;
}

interface BlogCommentSectionProps {
  slug: string;
}

export default function BlogCommentSection({ slug }: BlogCommentSectionProps) {
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [authorName, setAuthorName] = useState("");
  const [email, setEmail] = useState("");
  const [body, setBody] = useState("");
  const [website, setWebsite] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/blog/posts/${slug}/comments`)
      .then((res) => res.json())
      .then((data) => setComments(data.comments ?? []))
      .catch(() => setComments([]));
  }, [slug]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(`/api/blog/posts/${slug}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authorName, email, body, website }),
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) throw new Error(data.error ?? "Unable to submit comment");
      setMessage(data.message ?? "Comment submitted.");
      setBody("");
      setWebsite("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to submit comment");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="blog-comments" aria-labelledby="blog-comments-title">
      <h2 id="blog-comments-title" className="blog-comments__title">
        Comments
      </h2>

      {comments.length > 0 ? (
        <ul className="blog-comments__list">
          {comments.map((comment) => (
            <li key={comment.id} className="blog-comments__item">
              <p className="blog-comments__author">{comment.authorName}</p>
              <p className="blog-comments__body">{comment.body}</p>
              <time className="blog-comments__time" dateTime={comment.createdAt}>
                {new Date(comment.createdAt).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </time>
            </li>
          ))}
        </ul>
      ) : (
        <p className="blog-comments__empty">Be the first to share your thoughts.</p>
      )}

      <form className="blog-comments__form" onSubmit={handleSubmit}>
        <div className="blog-comments__row">
          <label>
            Name
            <input required value={authorName} onChange={(e) => setAuthorName(e.target.value)} />
          </label>
          <label>
            Email
            <input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
        </div>
        <label className="blog-comments__honeypot" aria-hidden="true">
          Website
          <input tabIndex={-1} autoComplete="off" value={website} onChange={(e) => setWebsite(e.target.value)} />
        </label>
        <label>
          Comment
          <textarea
            required
            rows={4}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            minLength={10}
            maxLength={2000}
          />
        </label>
        {error ? <p className="blog-comments__error">{error}</p> : null}
        {message ? <p className="blog-comments__success">{message}</p> : null}
        <button type="submit" disabled={submitting}>
          {submitting ? "Submitting…" : "Post comment"}
        </button>
      </form>
    </section>
  );
}
