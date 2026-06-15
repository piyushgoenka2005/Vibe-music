"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  Strikethrough,
  Underline as UnderlineIcon,
} from "lucide-react";
import { useEffect } from "react";
import {
  blogEditorExtensions,
  EMPTY_BLOG_CONTENT,
  parseBlogContent,
} from "@/lib/blog/editor";
import "./tiptap-editor.css";

interface TipTapEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

function ToolbarButton({
  active,
  onClick,
  label,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className={`tiptap-toolbar__btn${active ? " tiptap-toolbar__btn--active" : ""}`}
      onClick={onClick}
      aria-label={label}
      title={label}
    >
      {children}
    </button>
  );
}

export default function TipTapEditor({
  value,
  onChange,
  placeholder = "Write your post content…",
}: TipTapEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      ...blogEditorExtensions,
      Placeholder.configure({ placeholder }),
    ],
    content: parseBlogContent(value || EMPTY_BLOG_CONTENT),
    editorProps: {
      attributes: {
        class: "tiptap-editor__content",
      },
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange(JSON.stringify(currentEditor.getJSON()));
    },
  });

  useEffect(() => {
    if (!editor) return;
    const current = JSON.stringify(editor.getJSON());
    const next = value || EMPTY_BLOG_CONTENT;
    if (current !== next) {
      editor.commands.setContent(parseBlogContent(next), { emitUpdate: false });
    }
  }, [editor, value]);

  if (!editor) {
    return <div className="tiptap-editor tiptap-editor--loading">Loading editor…</div>;
  }

  function setLink() {
    const previous = editor!.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", previous ?? "https://");
    if (url === null) return;
    if (url === "") {
      editor!.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor!.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  return (
    <div className="tiptap-editor">
      <div className="tiptap-toolbar" role="toolbar" aria-label="Formatting">
        <ToolbarButton
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Underline"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <UnderlineIcon size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Strikethrough"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <Strikethrough size={16} />
        </ToolbarButton>
        <span className="tiptap-toolbar__divider" aria-hidden="true" />
        <ToolbarButton
          label="Heading 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Heading 3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 size={16} />
        </ToolbarButton>
        <span className="tiptap-toolbar__divider" aria-hidden="true" />
        <ToolbarButton
          label="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered size={16} />
        </ToolbarButton>
        <ToolbarButton
          label="Blockquote"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          <Quote size={16} />
        </ToolbarButton>
        <ToolbarButton label="Link" active={editor.isActive("link")} onClick={setLink}>
          <Link2 size={16} />
        </ToolbarButton>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
