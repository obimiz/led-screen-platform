import Image from "next/image";
import type { ReactNode } from "react";
import {
  sanitizeRichContent,
  type RichNode,
} from "@/lib/publishing/rich-content";
export function RichContent({
  content,
  fallback = "",
}: {
  content: unknown;
  fallback?: string;
}) {
  let doc: RichNode | null = null;
  try {
    if (content) doc = sanitizeRichContent(content);
  } catch {}
  function render(node: RichNode, key: number): ReactNode {
    const children = node.content?.map(render);
    const align = node.attrs?.textAlign as
      "left" | "center" | "right" | "justify" | undefined;
    switch (node.type) {
      case "doc":
        return <div key={key}>{children}</div>;
      case "text": {
        let value: ReactNode = node.text;
        for (const mark of node.marks || [])
          value =
            mark.type === "bold" ? (
              <strong>{value}</strong>
            ) : mark.type === "italic" ? (
              <em>{value}</em>
            ) : mark.type === "link" ? (
              <a
                href={mark.attrs?.href || ""}
                target="_blank"
                rel="noopener noreferrer"
                className="text-brand-700 underline"
              >
                {value}
              </a>
            ) : (
              value
            );
        return <span key={key}>{value}</span>;
      }
      case "paragraph":
        return (
          <p
            key={key}
            style={{ textAlign: align }}
            className="my-4 leading-8 break-words"
          >
            {children}
          </p>
        );
      case "heading":
        return node.attrs?.level === 2 ? (
          <h2
            key={key}
            style={{ textAlign: align }}
            className="mt-8 mb-4 text-2xl font-bold"
          >
            {children}
          </h2>
        ) : node.attrs?.level === 3 ? (
          <h3
            key={key}
            style={{ textAlign: align }}
            className="mt-6 mb-3 text-xl font-bold"
          >
            {children}
          </h3>
        ) : (
          <h4
            key={key}
            style={{ textAlign: align }}
            className="mt-5 mb-2 text-lg font-bold"
          >
            {children}
          </h4>
        );
      case "bulletList":
        return (
          <ul key={key} className="my-4 list-disc space-y-2 pl-7">
            {children}
          </ul>
        );
      case "orderedList":
        return (
          <ol
            key={key}
            start={Number(node.attrs?.start) || 1}
            className="my-4 list-decimal space-y-2 pl-7"
          >
            {children}
          </ol>
        );
      case "listItem":
        return <li key={key}>{children}</li>;
      case "blockquote":
        return (
          <blockquote
            key={key}
            className="border-brand-700 bg-brand-50 my-6 border-l-4 px-5 py-1 italic"
          >
            {children}
          </blockquote>
        );
      case "hardBreak":
        return <br key={key} />;
      case "horizontalRule":
        return <hr key={key} className="my-6" />;
      case "image": {
        const src = String(node.attrs?.src || "");
        return (
          <figure key={key} className="my-6">
            <Image
              src={src}
              alt={String(node.attrs?.alt || "")}
              width={1400}
              height={1000}
              sizes="(max-width:768px) 100vw,900px"
              unoptimized={!src.startsWith("/")}
              className="h-auto max-h-[700px] w-full rounded-xl object-contain"
            />
            <figcaption className="mt-2 text-sm text-slate-600">
              {node.attrs?.alt}
            </figcaption>
          </figure>
        );
      }
      default:
        return null;
    }
  }
  return (
    <div className="min-w-0">
      {doc
        ? render(doc, 0)
        : fallback.split(/\n\s*\n/).map((p, i) => (
            <p
              key={i}
              className="my-4 leading-8 break-words whitespace-pre-wrap"
            >
              {p}
            </p>
          ))}
    </div>
  );
}
