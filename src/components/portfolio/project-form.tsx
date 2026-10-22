"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { salesFetch } from "@/components/sales/client-api";
import { buttonClass, inputClass, Field } from "@/components/sales/ui";
import { ContentMediaManager } from "@/components/publishing/media-manager";
import { type RichNode } from "@/lib/publishing/rich-content";
const RichEditor = dynamic(
  () => import("@/components/publishing/editor").then((m) => m.RichEditor),
  { ssr: false, loading: () => <p>Loading editor…</p> },
);
export type PublishingCategory = {
  id: string;
  name: string;
  isActive: boolean;
  scope?: string;
};
export type PublishingFormValue = {
  id?: string;
  title: string;
  slug: string;
  contentType: "project" | "article";
  shortDescription: string;
  description: string;
  richContent: RichNode | null;
  author: string;
  categoryId: string;
  customerName: string;
  customerDisplayName: string;
  hideCustomerName: boolean;
  clientPermissionConfirmed: boolean;
  mediaPermissionConfirmed: boolean;
  city: string;
  state: string;
  country: string;
  venueName: string;
  completionDate: string;
  projectStatus: string;
  projectType: string;
  servicesProvided: string[];
  productsUsed: string[];
  coverImageUrl: string;
  coverAlt: string;
  imageUrls: string[];
  imageAlts: string[];
  videoUrl: string;
  tags: string[];
  featured: boolean;
  sortOrder: number;
  status: string;
  publishedAt: string | null;
  seoTitle: string;
  seoDescription: string;
};
export function PortfolioProjectForm({
  initial,
  categories = [],
}: {
  initial?: Partial<PublishingFormValue>;
  categories?: PublishingCategory[];
}) {
  const [item, setItem] = useState<PublishingFormValue>({
    title: "",
    slug: "",
    contentType: "article",
    shortDescription: "",
    description: "",
    richContent: null,
    author: "",
    customerName: "",
    customerDisplayName: "",
    hideCustomerName: true,
    clientPermissionConfirmed: false,
    mediaPermissionConfirmed: false,
    city: "",
    state: "",
    country: "",
    venueName: "",
    completionDate: "",
    projectStatus: "completed",
    projectType: "custom",
    servicesProvided: [],
    productsUsed: [],
    coverImageUrl: "",
    coverAlt: "",
    imageUrls: [],
    videoUrl: "",
    tags: [],
    featured: false,
    sortOrder: 0,
    status: "draft",
    publishedAt: null,
    seoTitle: "",
    seoDescription: "",
    ...initial,
    categoryId: initial?.categoryId || "",
    imageAlts: (initial?.imageUrls || []).map(
      (_, i) => initial?.imageAlts?.[i] || "",
    ),
  });
  const [busy, setBusy] = useState(false),
    [uploading, setUploading] = useState(false),
    [error, setError] = useState(""),
    [dirty, setDirty] = useState(false),
    [message, setMessage] = useState("");
  const router = useRouter();
  const change = <K extends keyof PublishingFormValue>(
    key: K,
    value: PublishingFormValue[K],
  ) => {
    setItem((v) => ({ ...v, [key]: value }));
    setDirty(true);
  };
  useEffect(() => {
    const unload = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    const leave = (e: MouseEvent) => {
      if (
        dirty &&
        e.target instanceof Element &&
        e.target.closest("a[href]") &&
        !confirm("Discard unsaved post changes?")
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("beforeunload", unload);
    document.addEventListener("click", leave, true);
    return () => {
      window.removeEventListener("beforeunload", unload);
      document.removeEventListener("click", leave, true);
    };
  }, [dirty]);
  async function save(status: string, preview = false) {
    setBusy(true);
    setError("");
    setMessage("Saving…");
    try {
      const saved = await salesFetch<{ id: string }>(
        item.id ? `/api/portfolio/${item.id}` : "/api/portfolio",
        item.id ? "PUT" : "POST",
        {
          ...item,
          status,
          tags: item.tags.map((v) => v.trim()).filter(Boolean),
          servicesProvided: item.servicesProvided
            .map((v) => v.trim())
            .filter(Boolean),
          productsUsed: item.productsUsed.map((v) => v.trim()).filter(Boolean),
        },
      );
      setDirty(false);
      router.push(
        preview ? `/admin/blog/${saved.id}/preview` : "/admin/blog?saved=1",
      );
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setMessage("");
    } finally {
      setBusy(false);
    }
  }
  const text = (
    key: keyof PublishingFormValue,
    label: string,
    max = 180,
    type = "text",
  ) => (
    <Field label={label}>
      <input
        className={inputClass}
        type={type}
        maxLength={max}
        value={String(item[key] || "")}
        onChange={(e) => change(key, e.target.value as never)}
      />
    </Field>
  );
  const lines = (key: "servicesProvided" | "productsUsed", label: string) => (
    <Field label={label}>
      <textarea
        className={inputClass}
        rows={3}
        value={item[key].join("\n")}
        onChange={(e) => change(key, e.target.value.split("\n"))}
      />
    </Field>
  );
  return (
    <form
      className="max-w-4xl space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        const value = (e.nativeEvent as SubmitEvent).submitter?.getAttribute(
          "value",
        );
        void save(
          value === "published"
            ? "published"
            : value === "draft"
              ? "draft"
              : item.status,
          value === "preview",
        );
      }}
    >
      <fieldset
        disabled={busy || uploading}
        className="min-w-0 space-y-6 disabled:opacity-60"
      >
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Content type">
            <select
              className={inputClass}
              value={item.contentType}
              onChange={(e) => {
                change("contentType", e.target.value as "article" | "project");
                change("categoryId", "");
              }}
            >
              <option value="article">Blog article</option>
              <option value="project">Completed project</option>
            </select>
          </Field>
          <Field label="Title">
            <input
              className={inputClass}
              required
              minLength={2}
              maxLength={180}
              value={item.title}
              onChange={(e) => change("title", e.target.value)}
            />
          </Field>
          {text("slug", "URL slug (optional; generated from title)")}
          <Field label="Category">
            <select
              className={inputClass}
              value={item.categoryId}
              onChange={(e) => change("categoryId", e.target.value)}
            >
              <option value="">Choose category</option>
              {categories
                .filter(
                  (c) =>
                    (c.isActive || c.id === item.categoryId) &&
                    (!c.scope ||
                      c.scope === "all" ||
                      c.scope === item.contentType),
                )
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                    {!c.isActive ? " (inactive)" : ""}
                  </option>
                ))}
            </select>
            <Link className="text-sm underline" href="/admin/blog/categories">
              Manage categories
            </Link>
          </Field>
          {item.contentType === "article" ? (
            <>
              {text("author", "Author", 160)}
              <Field label="Publication date (optional)">
                <input
                  type="datetime-local"
                  className={inputClass}
                  value={
                    item.publishedAt
                      ? new Date(item.publishedAt).toISOString().slice(0, 16)
                      : ""
                  }
                  onChange={(e) =>
                    change(
                      "publishedAt",
                      e.target.value
                        ? new Date(`${e.target.value}Z`).toISOString()
                        : null,
                    )
                  }
                />
                <p className="mt-1 text-xs text-slate-600">
                  Shown in UTC. Future scheduling is not enabled; use drafts
                  until ready.
                </p>
              </Field>
              <Field label="Tags (comma separated)">
                <input
                  className={inputClass}
                  value={item.tags.join(",")}
                  onChange={(e) => change("tags", e.target.value.split(","))}
                />
              </Field>
            </>
          ) : (
            <>
              {text(
                "customerName",
                "Client or organisation (private unless approved)",
                160,
              )}
              {text(
                "customerDisplayName",
                "Approved public client display name",
                160,
              )}
              <Field label="Project completion status">
                <select
                  className={inputClass}
                  value={item.projectStatus}
                  onChange={(e) => change("projectStatus", e.target.value)}
                >
                  <option value="completed">Completed</option>
                  <option value="in-progress">In progress (draft only)</option>
                  <option value="planned">Planned (draft only)</option>
                </select>
              </Field>
              {text("completionDate", "Completion date", 10, "date")}
              <Field label="Service / equipment type">
                <select
                  className={inputClass}
                  value={item.projectType}
                  onChange={(e) => change("projectType", e.target.value)}
                >
                  {[
                    "led-installation",
                    "led-rental",
                    "led-sales",
                    "event-setup",
                    "bell-alarm",
                    "maintenance",
                    "custom",
                  ].map((v) => (
                    <option key={v} value={v}>
                      {v.replaceAll("-", " ")}
                    </option>
                  ))}
                </select>
              </Field>
              {text("city", "Project location / city (optional)", 100)}
              {text("state", "State (optional)", 100)}
              {text("country", "Country (optional)", 100)}
              {text("venueName", "Venue (optional)", 180)}
              {lines("servicesProvided", "Services delivered (one per line)")}
              {lines(
                "productsUsed",
                "Equipment / LED screen types used (one per line)",
              )}
              {text("videoUrl", "Project video URL (optional)", 2000, "url")}
            </>
          )}
        </div>
        <Field
          label={
            item.contentType === "article"
              ? "Short excerpt"
              : "Short project description"
          }
        >
          <textarea
            className={inputClass}
            required
            minLength={10}
            maxLength={500}
            rows={3}
            value={item.shortDescription}
            onChange={(e) => change("shortDescription", e.target.value)}
          />
        </Field>
        <div>
          <h2 className="mb-3 text-xl font-bold">
            Detailed description / article content
          </h2>
          <RichEditor
            initial={item.richContent}
            fallback={item.description}
            onChange={(v) => change("richContent", v)}
            onBusyChange={setUploading}
          />
        </div>
        <ContentMediaManager
          value={item}
          onBusyChange={setUploading}
          onChange={(media) => {
            setItem((v) => ({ ...v, ...media }));
            setDirty(true);
          }}
        />
        <section className="space-y-4 rounded-xl border p-4">
          <h2 className="font-bold">Publication permissions</h2>
          <label className="flex gap-3">
            <input
              type="checkbox"
              checked={item.mediaPermissionConfirmed}
              onChange={(e) =>
                change("mediaPermissionConfirmed", e.target.checked)
              }
            />
            I confirm permission to publish this content, photographs and video.
          </label>
          {item.contentType === "project" && (
            <>
              <label className="flex gap-3">
                <input
                  type="checkbox"
                  checked={!item.hideCustomerName}
                  onChange={(e) =>
                    change("hideCustomerName", !e.target.checked)
                  }
                />
                Display the approved client name publicly
              </label>
              <label className="flex gap-3">
                <input
                  type="checkbox"
                  checked={item.clientPermissionConfirmed}
                  onChange={(e) =>
                    change("clientPermissionConfirmed", e.target.checked)
                  }
                />
                The client has approved publication of their name and project
                information.
              </label>
            </>
          )}
        </section>
        <details className="rounded-xl border p-4">
          <summary className="cursor-pointer font-semibold">
            Search engine metadata
          </summary>
          <div className="mt-4 grid gap-4">
            {text("seoTitle", "SEO title", 180)}
            <Field label="SEO description">
              <textarea
                className={inputClass}
                rows={3}
                maxLength={320}
                value={item.seoDescription}
                onChange={(e) => change("seoDescription", e.target.value)}
              />
            </Field>
          </div>
        </details>
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={item.featured}
              onChange={(e) => change("featured", e.target.checked)}
            />
            Featured
          </label>
          <Field label="Display order">
            <input
              type="number"
              min={0}
              max={100000}
              className={inputClass}
              value={item.sortOrder}
              onChange={(e) => change("sortOrder", Number(e.target.value))}
            />
          </Field>
          <Field label="Publication status">
            <select
              className={inputClass}
              value={item.status}
              onChange={(e) => change("status", e.target.value)}
            >
              {["draft", "published", "archived"].map((v) => (
                <option value={v} key={v}>
                  {v}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <div className="flex flex-wrap gap-3">
          <button name="intent" value="save" className={buttonClass}>
            Save changes
          </button>
          <button
            name="intent"
            value="draft"
            className="rounded-lg border px-4 py-2"
          >
            Save as Draft
          </button>
          <button name="intent" value="published" className={buttonClass}>
            Publish post
          </button>
          <button
            name="intent"
            value="preview"
            className="rounded-lg border px-4 py-2"
          >
            Save & Preview
          </button>
          <Link href="/admin/blog" className="px-3 py-2 underline">
            Cancel
          </Link>
        </div>
      </fieldset>
      {(busy || uploading) && (
        <p role="status">Working… Please keep this page open.</p>
      )}
      {message && <p role="status">{message}</p>}
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
    </form>
  );
}
