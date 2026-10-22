"use client";
import { useState } from "react";
import { useEditor, EditorContent, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import TextAlign from "@tiptap/extension-text-align";
import {
  type RichNode,
  safeLink,
  textDocument,
} from "@/lib/publishing/rich-content";
export function RichEditor({
  initial,
  fallback,
  onChange,
  onBusyChange,
}: {
  initial?: RichNode | null;
  fallback?: string;
  onChange: (value: RichNode) => void;
  onBusyChange?: (busy: boolean) => void;
}) {
  const [href, setHref] = useState(""),
    [alt, setAlt] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3, 4] },
        code: false,
        codeBlock: false,
        strike: false,
        underline: false,
        link: { openOnClick: false, autolink: false, linkOnPaste: false },
      }),
      ImageExtension.configure({ allowBase64: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: initial || textDocument(fallback || ""),
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-label": "Detailed content",
        "aria-multiline": "true",
        class: "min-h-72 rounded-b-xl bg-white p-5 outline-none",
      },
    },
    onUpdate: ({ editor }) => onChange(editor.getJSON() as RichNode),
  });
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e?.isActive("bold"),
      italic: e?.isActive("italic"),
      bullet: e?.isActive("bulletList"),
      ordered: e?.isActive("orderedList"),
      quote: e?.isActive("blockquote"),
      style: e?.isActive("heading")
        ? String(e.getAttributes("heading").level)
        : "paragraph",
    }),
  });
  const button =
    "rounded border px-3 py-2 text-sm font-semibold hover:bg-brand-50 disabled:opacity-50";
  return (
    <section className="rounded-xl border" aria-label="Rich text editor">
      <div
        className="flex flex-wrap gap-2 border-b bg-slate-50 p-3"
        role="toolbar"
        aria-label="Text formatting"
      >
        <button
          type="button"
          className={button}
          disabled={!editor}
          aria-pressed={!!state?.bold}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          Bold
        </button>
        <button
          type="button"
          className={button}
          disabled={!editor}
          aria-pressed={!!state?.italic}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          Italic
        </button>
        <select
          aria-label="Text style"
          className="max-w-full rounded border p-2"
          value={state?.style || "paragraph"}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (n)
              editor
                ?.chain()
                .focus()
                .setHeading({ level: n as 2 | 3 | 4 })
                .run();
            else editor?.chain().focus().setParagraph().run();
          }}
        >
          <option value="paragraph">Paragraph</option>
          <option value="2">Heading 2</option>
          <option value="3">Heading 3</option>
          <option value="4">Heading 4</option>
        </select>
        <button
          type="button"
          className={button}
          aria-pressed={!!state?.bullet}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          Bullet list
        </button>
        <button
          type="button"
          className={button}
          aria-pressed={!!state?.ordered}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          Numbered list
        </button>
        <button
          type="button"
          className={button}
          aria-pressed={!!state?.quote}
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
        >
          Quote
        </button>
        {(["left", "center", "right"] as const).map((a) => (
          <button
            type="button"
            key={a}
            className={button}
            onClick={() => editor?.chain().focus().setTextAlign(a).run()}
          >
            Align {a}
          </button>
        ))}
        <button
          type="button"
          className={button}
          onClick={() => editor?.chain().focus().undo().run()}
        >
          Undo
        </button>
        <button
          type="button"
          className={button}
          onClick={() => editor?.chain().focus().redo().run()}
        >
          Redo
        </button>
      </div>
      <div className="flex flex-wrap items-end gap-2 border-b p-3">
        <label className="text-sm">
          Link URL
          <input
            className="ml-2 max-w-full rounded border p-2"
            type="url"
            value={href}
            onChange={(e) => setHref(e.target.value)}
            placeholder="https://…"
          />
        </label>
        <button
          type="button"
          className={button}
          onClick={() => {
            if (!safeLink(href)) {
              setMessage("Enter a valid HTTP(S), email or telephone link.");
              return;
            }
            editor
              ?.chain()
              .focus()
              .extendMarkRange("link")
              .setLink({ href })
              .run();
            setMessage("Link added to selected text.");
          }}
        >
          Apply link
        </button>
        <button
          type="button"
          className={button}
          onClick={() => editor?.chain().focus().unsetLink().run()}
        >
          Remove link
        </button>
      </div>
      <div className="flex flex-wrap gap-3 border-b p-3">
        <label className="text-sm">
          Inline image alt text
          <input
            className="mt-1 block w-full rounded border p-2"
            value={alt}
            maxLength={300}
            onChange={(e) => setAlt(e.target.value)}
          />
        </label>
        <label className="min-w-0 text-sm">
          Insert image (PNG, JPEG, WebP; 4 MB)
          <input
            className="mt-2 block max-w-full"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            disabled={busy || !editor}
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              if (!alt.trim()) {
                setMessage(
                  "Add meaningful alt text before inserting an image.",
                );
                return;
              }
              if (file.size > 4 * 1024 * 1024) {
                setMessage("Maximum image size is 4 MB.");
                return;
              }
              setBusy(true);
              onBusyChange?.(true);
              setMessage("Uploading image…");
              try {
                const r = await fetch("/api/product-images", {
                  method: "POST",
                  headers: {
                    "Content-Type": file.type,
                    "X-File-Name": encodeURIComponent(file.name),
                  },
                  body: file,
                });
                const b = await r.json();
                if (!r.ok) throw Error(b.message);
                editor
                  ?.chain()
                  .focus()
                  .setImage({ src: b.url, alt: alt.trim() })
                  .run();
                setMessage("Image inserted. Save the post to apply changes.");
              } catch (e) {
                setMessage((e as Error).message);
              } finally {
                setBusy(false);
                onBusyChange?.(false);
              }
            }}
          />
        </label>
      </div>
      {!editor && (
        <p className="p-5" role="status">
          Loading editor…
        </p>
      )}
      <EditorContent editor={editor} className="publishing-editor" />
      {message && (
        <p className="p-3 text-sm" role="status">
          {message}
        </p>
      )}
    </section>
  );
}
