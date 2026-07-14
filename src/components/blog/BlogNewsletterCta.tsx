"use client";

import { useState } from "react";

export default function BlogNewsletterCta() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setStatus("loading");
    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source: "blog" }),
      });
      if (!response.ok) throw new Error("Subscribe failed");
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  }

  return (
    <aside className="blog-newsletter" aria-labelledby="blog-newsletter-title">
      <h2 id="blog-newsletter-title" className="blog-newsletter__title">
        Get gear guides in your inbox
      </h2>
      <p className="blog-newsletter__copy">
        Studio tips, buying guides, and new articles from the Vibe Music team.
      </p>
      <form className="blog-newsletter__form" onSubmit={handleSubmit}>
        <label className="blog-newsletter__label" htmlFor="blog-newsletter-email">
          Email address
        </label>
        <div className="blog-newsletter__row">
          <input
            id="blog-newsletter-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
          <button type="submit" disabled={status === "loading"}>
            {status === "loading" ? "Signing up…" : "Subscribe"}
          </button>
        </div>
      </form>
      {status === "success" ? (
        <p className="blog-newsletter__success">Thanks for subscribing.</p>
      ) : null}
      {status === "error" ? (
        <p className="blog-newsletter__error">Unable to subscribe right now.</p>
      ) : null}
    </aside>
  );
}
