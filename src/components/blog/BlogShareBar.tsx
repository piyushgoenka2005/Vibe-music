"use client";

import { useState } from "react";
import { buildShareUrls } from "@/lib/blog/blogEngine";

interface BlogShareBarProps {
  url: string;
  title: string;
  slug: string;
}

export default function BlogShareBar({ url, title, slug }: BlogShareBarProps) {
  const [copied, setCopied] = useState(false);
  const links = buildShareUrls(url, title);

  async function trackShare(channel: string) {
    try {
      await fetch(`/api/blog/posts/${slug}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel }),
      });
    } catch {
      /* ignore analytics failures */
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
      void trackShare("copy");
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="blog-share" aria-label="Share this article">
      <span className="blog-share__label">Share</span>
      <div className="blog-share__actions">
        <a
          className="blog-share__btn"
          href={links.twitter}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => void trackShare("twitter")}
        >
          X
        </a>
        <a
          className="blog-share__btn"
          href={links.facebook}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => void trackShare("facebook")}
        >
          Facebook
        </a>
        <a
          className="blog-share__btn"
          href={links.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => void trackShare("linkedin")}
        >
          LinkedIn
        </a>
        <a
          className="blog-share__btn"
          href={links.whatsapp}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => void trackShare("whatsapp")}
        >
          WhatsApp
        </a>
        <button type="button" className="blog-share__btn" onClick={() => void copyLink()}>
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
    </div>
  );
}
