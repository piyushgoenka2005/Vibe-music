"use client";

interface MarkupBlockProps {
  html: string;
  className?: string;
}

/** Renders pre-normalized legacy header HTML fragments. */
export default function MarkupBlock({ html, className }: MarkupBlockProps) {
  if (!html) return null;

  return (
    <div
      className={className}
      style={{ display: "contents" }}
      dangerouslySetInnerHTML={{ __html: html }}
      suppressHydrationWarning
    />
  );
}
