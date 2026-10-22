import { z } from "zod";
export function safeLink(value: string) {
  try {
    const u = new URL(value);
    return (
      ["https:", "http:", "mailto:", "tel:"].includes(u.protocol) &&
      !u.username &&
      !u.password &&
      !/[\x00-\x20]/.test(value)
    );
  } catch {
    return false;
  }
}
export function safeImage(value: string) {
  if (
    /^\/(?!\/)[A-Za-z0-9_./%() -]+$/.test(value) &&
    !value.includes("..") &&
    !/%(?:2f|5c|2e)/i.test(value)
  )
    return true;
  try {
    const u = new URL(value);
    return (
      ["http:", "https:"].includes(u.protocol) &&
      !u.username &&
      !u.password &&
      !/[\x00-\x20]/.test(value)
    );
  } catch {
    return false;
  }
}
export type RichNode = {
  type: string;
  text?: string;
  attrs?: Record<string, string | number | null>;
  marks?: { type: string; attrs?: Record<string, string | null> }[];
  content?: RichNode[];
};
const allowed = [
  "doc",
  "paragraph",
  "heading",
  "text",
  "bulletList",
  "orderedList",
  "listItem",
  "blockquote",
  "hardBreak",
  "horizontalRule",
  "image",
];
export function sanitizeRichContent(value: unknown): RichNode {
  let nodes = 0,
    characters = 0;
  const fail = () => {
    throw Error(
      "Invalid rich content. Use the supported editor formatting and safe links/images.",
    );
  };
  function walk(raw: unknown, depth: number): RichNode {
    if (
      ++nodes > 4000 ||
      depth > 20 ||
      !raw ||
      typeof raw !== "object" ||
      Array.isArray(raw)
    )
      return fail();
    const n = raw as Record<string, unknown>;
    if (typeof n.type !== "string" || !allowed.includes(n.type)) return fail();
    const result: RichNode = { type: n.type };
    if (n.type === "text") {
      if (typeof n.text !== "string" || !n.text.length) return fail();
      characters += n.text.length;
      if (characters > 60000) return fail();
      result.text = n.text;
    }
    const attrs =
      n.attrs && typeof n.attrs === "object"
        ? (n.attrs as Record<string, unknown>)
        : {};
    if (["paragraph", "heading"].includes(n.type)) {
      result.attrs = {};
      if (attrs.textAlign != null) {
        if (
          !["left", "center", "right", "justify"].includes(
            String(attrs.textAlign),
          )
        )
          return fail();
        result.attrs.textAlign = String(attrs.textAlign);
      }
      if (n.type === "heading") {
        if (![2, 3, 4].includes(Number(attrs.level))) return fail();
        result.attrs.level = Number(attrs.level);
      }
    }
    if (n.type === "orderedList")
      result.attrs = {
        start:
          Number.isSafeInteger(attrs.start) &&
          Number(attrs.start) > 0 &&
          Number(attrs.start) < 10000
            ? Number(attrs.start)
            : 1,
      };
    if (n.type === "image") {
      if (
        typeof attrs.src !== "string" ||
        !safeImage(attrs.src) ||
        typeof attrs.alt !== "string" ||
        !attrs.alt.trim() ||
        attrs.alt.length > 300
      )
        return fail();
      result.attrs = { src: attrs.src, alt: attrs.alt.trim() };
    }
    if (n.marks !== undefined) {
      if (n.type !== "text" || !Array.isArray(n.marks) || n.marks.length > 3)
        return fail();
      result.marks = n.marks.map((mark: unknown) => {
        if (!mark || typeof mark !== "object") return fail();
        const m = mark as { type: string; attrs?: { href?: unknown } };
        if (m.type === "bold" || m.type === "italic") return { type: m.type };
        if (
          m.type === "link" &&
          typeof m.attrs?.href === "string" &&
          safeLink(m.attrs.href)
        )
          return { type: "link", attrs: { href: m.attrs.href } };
        return fail();
      });
    }
    if (n.content !== undefined) {
      if (
        !Array.isArray(n.content) ||
        ["text", "image", "hardBreak", "horizontalRule"].includes(n.type)
      )
        return fail();
      result.content = n.content.map((c) => walk(c, depth + 1));
      const children = result.content.map((c) => c.type);
      if (
        ["paragraph", "heading"].includes(n.type) &&
        children.some((t) => !["text", "hardBreak"].includes(t))
      )
        return fail();
      if (
        ["bulletList", "orderedList"].includes(n.type) &&
        children.some((t) => t !== "listItem")
      )
        return fail();
      if (
        ["doc", "blockquote", "listItem"].includes(n.type) &&
        children.some((t) =>
          ["doc", "text", "hardBreak", "listItem"].includes(t),
        )
      )
        return fail();
    }
    if (n.type === "doc" && depth !== 0) return fail();
    return result;
  }
  const result = walk(value, 0);
  if (result.type !== "doc") return fail();
  return result;
}
export const richContentSchema = z.unknown().transform((value, ctx) => {
  if (value === undefined || value === null) return null;
  try {
    return sanitizeRichContent(value);
  } catch {
    ctx.addIssue({
      code: "custom",
      message:
        "Invalid rich content: check formatting, image alt text and link URLs.",
    });
    return z.NEVER;
  }
});
export function richText(node: RichNode | null | undefined): string {
  return node
    ? [node.text || "", ...(node.content || []).map(richText)]
        .filter(Boolean)
        .join(" ")
    : "";
}
export function textDocument(text: string): RichNode {
  return {
    type: "doc",
    content: text
      .split(/\n\s*\n/)
      .filter(Boolean)
      .map((t) => ({
        type: "paragraph",
        content: [{ type: "text", text: t }],
      })),
  };
}
