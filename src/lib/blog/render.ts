import "server-only";

import "server-only";

import { generateHTML } from "@tiptap/html";
import { blogEditorExtensions, parseBlogContent } from "@/lib/blog/editor";
import { sanitizeHtml } from "@/lib/security/sanitize";

export function renderBlogContentHtml(content: string): string {
  const json = parseBlogContent(content);
  return sanitizeHtml(generateHTML(json, blogEditorExtensions));
}
