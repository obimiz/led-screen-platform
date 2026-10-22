import assert from "node:assert/strict";
import test from "node:test";
import {
  sanitizeRichContent,
  safeImage,
  safeLink,
  richText,
  textDocument,
} from "../src/lib/publishing/rich-content";
import {
  portfolioProjectSchema,
  portfolioCategorySchema,
} from "../src/lib/validations/portfolio";
import {
  buildArticleMetadata,
  buildArticleJsonLd,
} from "../src/lib/seo/publishing";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { RichContent } from "../src/components/publishing/rich-content";
const content = {
  type: "doc",
  content: [
    {
      type: "heading",
      attrs: { level: 2, textAlign: "center", onclick: "unsafe" },
      content: [{ type: "text", text: "Heading" }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Body",
          marks: [
            { type: "bold" },
            { type: "italic" },
            {
              type: "link",
              attrs: { href: "https://example.test", onclick: "bad" },
            },
          ],
        },
      ],
    },
    {
      type: "bulletList",
      content: [
        {
          type: "listItem",
          content: [
            { type: "paragraph", content: [{ type: "text", text: "Item" }] },
          ],
        },
      ],
    },
    {
      type: "blockquote",
      content: [
        { type: "paragraph", content: [{ type: "text", text: "Quote" }] },
      ],
    },
    {
      type: "image",
      attrs: {
        src: "/api/product-images/abc",
        alt: "Display photograph",
        onerror: "bad",
      },
    },
  ],
};
test("rich content preserves formatting while stripping untrusted attributes", () => {
  const safe = sanitizeRichContent(content);
  assert.equal(safe.content?.[0].attrs?.textAlign, "center");
  assert.equal(safe.content?.[0].attrs?.onclick, undefined);
  assert.equal(safe.content?.[4].attrs?.onerror, undefined);
  assert.match(richText(safe), /Heading Body Item Quote/);
  const html = renderToStaticMarkup(
    createElement(RichContent, { content: safe }),
  );
  assert.match(html, /<strong>/);
  assert.match(html, /<em>/);
  assert.match(html, /<blockquote/);
  assert.match(html, /<ul/);
  assert.ok(!html.includes("onerror"));
  assert.ok(!html.includes("onclick"));
});
test("rich content rejects scripts, unsafe links and images, depth and node floods", () => {
  for (const node of [
    { type: "script", text: "alert(1)" },
    { type: "image", attrs: { src: "javascript:alert(1)", alt: "x" } },
    { type: "image", attrs: { src: "/safe.png", alt: "" } },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "click",
          marks: [{ type: "link", attrs: { href: "javascript:alert(1)" } }],
        },
      ],
    },
  ])
    assert.throws(() => sanitizeRichContent({ type: "doc", content: [node] }));
  assert.throws(() =>
    sanitizeRichContent({
      type: "doc",
      content: Array.from({ length: 4001 }, () => ({ type: "paragraph" })),
    }),
  );
  let node: unknown = { type: "paragraph" };
  for (let i = 0; i < 22; i++) node = { type: "blockquote", content: [node] };
  assert.throws(() => sanitizeRichContent({ type: "doc", content: [node] }));
  assert.throws(() => sanitizeRichContent(textDocument("x".repeat(60001))));
  for (const v of [
    "//evil.test/x",
    "data:image/svg+xml,a",
    "javascript:alert(1)",
    "/../secret",
    "/%2e%2e/secret",
    "https://user:pass@example.test/a",
  ])
    assert.equal(safeImage(v), false, v);
  assert.equal(safeLink("javascript:alert(1)"), false);
  assert.equal(safeLink("https://example.test"), true);
});
test("rich text renders embedded HTML as escaped text without executing it", () => {
  const html = renderToStaticMarkup(
    createElement(RichContent, {
      content: textDocument("<img src=x onerror=alert(1)>"),
    }),
  );
  assert.ok(!html.includes("<img src=x"));
  assert.ok(html.includes("&lt;img"));
});
const draft = {
  title: "Real project title",
  shortDescription: "A detailed test excerpt.",
  description: "A full description.",
  contentType: "project",
  completionDate: "2026-10-01",
  categoryId: "123456789012345678901234",
  coverImageUrl: "/cover.png",
  coverAlt: "LED installation",
  mediaPermissionConfirmed: true,
};
test("publishing enforces completion, author, category, consent and image accessibility", () => {
  assert.equal(
    portfolioProjectSchema.safeParse({ ...draft, status: "published" }).success,
    true,
  );
  for (const change of [
    { completionDate: "" },
    { completionDate: "2026-02-31" },
    { projectStatus: "in-progress" },
    { categoryId: "" },
    { mediaPermissionConfirmed: false },
    { coverAlt: "" },
    { hideCustomerName: false, clientPermissionConfirmed: false },
    { imageUrls: ["/one.png"], imageAlts: [] },
  ])
    assert.equal(
      portfolioProjectSchema.safeParse({
        ...draft,
        status: "published",
        ...change,
      }).success,
      false,
      JSON.stringify(change),
    );
  assert.equal(
    portfolioProjectSchema.safeParse({
      ...draft,
      contentType: "article",
      author: "Writer",
      status: "published",
    }).success,
    true,
  );
  assert.equal(
    portfolioProjectSchema.safeParse({
      ...draft,
      contentType: "article",
      status: "published",
    }).success,
    false,
  );
  assert.equal(
    portfolioProjectSchema.safeParse({
      title: "Draft",
      shortDescription: "A useful draft excerpt.",
      contentType: "article",
    }).success,
    true,
  );
  assert.equal(
    portfolioCategorySchema.safeParse({
      name: "Company News",
      scope: "article",
    }).success,
    true,
  );
});
test("article SEO uses canonical paths, article Open Graph and publication indexing controls", () => {
  const prior = process.env.NEXT_PUBLIC_APP_URL,
    flag = process.env.ALLOW_SEARCH_INDEXING;
  process.env.NEXT_PUBLIC_APP_URL = "https://example.test";
  process.env.ALLOW_SEARCH_INDEXING = "true";
  try {
    const item = {
      id: "x",
      title: "An article",
      slug: "an-article",
      shortDescription: "A useful description.",
      author: "Test author",
      status: "published",
      publishedAt: "2026-10-01T00:00:00.000Z",
      coverImageUrl: "/cover.png",
    };
    const meta = buildArticleMetadata(item, {
      businessName: "Image Grant Technology",
    } as Parameters<typeof buildArticleMetadata>[1]);
    assert.equal(
      meta.alternates?.canonical,
      "https://example.test/blog/an-article",
    );
    assert.equal((meta.openGraph as { type?: string }).type, "article");
    assert.equal((meta.robots as { index?: boolean }).index, true);
    assert.equal(buildArticleJsonLd(item)["@type"], "BlogPosting");
    assert.equal(buildArticleJsonLd(item).author?.name, "Test author");
    assert.equal(
      (
        buildArticleMetadata({ ...item, status: "draft" }, {
          businessName: "Image Grant Technology",
        } as Parameters<typeof buildArticleMetadata>[1]).robots as {
          index?: boolean;
        }
      ).index,
      false,
    );
  } finally {
    if (prior === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
    else process.env.NEXT_PUBLIC_APP_URL = prior;
    if (flag === undefined) delete process.env.ALLOW_SEARCH_INDEXING;
    else process.env.ALLOW_SEARCH_INDEXING = flag;
  }
});
