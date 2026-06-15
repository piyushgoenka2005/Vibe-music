import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";

export const blogEditorExtensions = [
  StarterKit.configure({
    heading: { levels: [2, 3, 4] },
  }),
  Link.configure({
    openOnClick: false,
    HTMLAttributes: { rel: "noopener noreferrer nofollow" },
  }),
  Underline,
];

export const EMPTY_BLOG_CONTENT = JSON.stringify({
  type: "doc",
  content: [{ type: "paragraph" }],
});

export function parseBlogContent(value: string): Record<string, unknown> {
  if (!value.trim()) {
    return JSON.parse(EMPTY_BLOG_CONTENT) as Record<string, unknown>;
  }
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return JSON.parse(EMPTY_BLOG_CONTENT) as Record<string, unknown>;
  }
}
