"use client";

import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import ImageExtension from "@tiptap/extension-image";
import { useEffect } from "react";

/**
 * The project has no rich-text editor installed anywhere else (checked:
 * no tiptap/quill/slate/draft-js in package.json before this task), so
 * this adds one rather than reusing something that doesn't exist -
 * TipTap, since it is React-native, headless (so it can be styled with
 * this project's own .article-body/.field-input classes instead of a
 * bundled theme), and produces clean semantic HTML.
 *
 * Configured to stay within apps.articles.serializers.ALLOWED_TAGS (the
 * backend's bleach allowlist: p, br, strong/b, em/i, u, h2/h3/h4, ul/ol/li,
 * blockquote, a, img) as closely as TipTap's own node/mark set allows -
 * StarterKit's code/codeBlock/horizontalRule/strike are disabled and
 * headings are capped to levels 2-4, so the editor never lets a reporter
 * produce formatting the backend would silently strip on save. The
 * backend sanitizer (sanitize_article_html) still always re-runs
 * server-side regardless - this is only about not surprising the
 * reporter with content that looks fine in the editor and then loses
 * formatting after saving.
 */
export function useArticleEditor(content: string, onUpdate: (html: string) => void): Editor | null {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        code: false,
        codeBlock: false,
        horizontalRule: false,
        strike: false,
      }),
      Underline,
      Link.configure({ openOnClick: false, autolink: true }),
      ImageExtension.configure({ inline: false }),
    ],
    content,
    editorProps: {
      attributes: {
        class: "article-body min-h-[16rem] focus:outline-none",
      },
    },
    onUpdate: ({ editor: e }) => onUpdate(e.getHTML()),
    immediatelyRender: false,
  });

  // Keep the editor's content in sync if the parent form resets it (e.g.
  // loading a draft's existing content after the initial empty render).
  useEffect(() => {
    if (editor && content && editor.isEmpty && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, content]);

  return editor;
}

function ToolbarButton({
  onClick,
  active,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`rounded px-2.5 py-1.5 text-sm font-semibold transition-colors ${
        active ? "bg-accent-50 text-accent-600" : "text-text-600 hover:bg-surface-50 hover:text-text-900"
      }`}
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({
  editor,
  disabled,
}: {
  editor: Editor | null;
  disabled?: boolean;
}) {
  if (!editor) {
    return <div className="skeleton h-64 w-full rounded-md" />;
  }

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Link URL", previousUrl || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const addImage = () => {
    const url = window.prompt("Image URL");
    if (url) editor.chain().focus().setImage({ src: url }).run();
  };

  return (
    <div className={`card ${disabled ? "opacity-60" : ""}`}>
      <div
        role="toolbar"
        aria-label="Text formatting"
        className="flex flex-wrap items-center gap-0.5 border-b border-border-200 p-1.5"
      >
        <ToolbarButton
          label="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton
          label="Underline"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <span className="underline">U</span>
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-border-200" aria-hidden="true" />
        <ToolbarButton
          label="Heading 2"
          active={editor.isActive("heading", { level: 2 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          H2
        </ToolbarButton>
        <ToolbarButton
          label="Heading 3"
          active={editor.isActive("heading", { level: 3 })}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          H3
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-border-200" aria-hidden="true" />
        <ToolbarButton
          label="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          &bull; List
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          1. List
        </ToolbarButton>
        <ToolbarButton
          label="Quote"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          &ldquo;&rdquo;
        </ToolbarButton>
        <span className="mx-1 h-5 w-px bg-border-200" aria-hidden="true" />
        <ToolbarButton label="Link" active={editor.isActive("link")} onClick={setLink}>
          Link
        </ToolbarButton>
        <ToolbarButton label="Insert image by URL" onClick={addImage}>
          Image
        </ToolbarButton>
      </div>
      <div className="px-4 py-3">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
