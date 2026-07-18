"use client";

import { findHighlightRange } from "@/lib/search/searchIntelligence";

interface SearchHighlightProps {
  text: string;
  query: string;
}

export default function SearchHighlight({ text, query }: SearchHighlightProps) {
  const range = findHighlightRange(text, query);
  if (!range) return <>{text}</>;

  return (
    <>
      {text.slice(0, range.start)}
      <mark className="sw-search-highlight">{text.slice(range.start, range.end)}</mark>
      {text.slice(range.end)}
    </>
  );
}
