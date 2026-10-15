"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { salesFetch } from "@/components/sales/client-api";
import { buttonClass, inputClass, Field } from "@/components/sales/ui";
import { musicPlatforms } from "@/lib/music/constants";
import { MusicPlayer } from "./audio-player";
type Category = { id: string; name: string; isActive: boolean };
type FormValue = {
  id?: string;
  title: string;
  artistName: string;
  categoryId: string;
  description: string;
  shortDescription: string;
  coverImageUrl: string;
  sourcePlatform: string;
  sourceUrl: string;
  audioUrl: string;
  audioAssetId: string;
  releaseYear: number | "";
  featured: boolean;
  status: string;
  sortOrder: number;
  contentRights: string;
  rightsConfirmed: boolean;
  rightsOwner: string;
  licenceInformation: string;
  rightsNotes: string;
  permissionToDistribute: boolean;
};
export function MusicContentForm({
  initial,
  categories,
}: {
  initial?: Partial<FormValue>;
  categories: Category[];
}) {
  const router = useRouter();
  const [item, setItem] = useState<FormValue>({
    title: "",
    artistName: "",
    description: "",
    shortDescription: "",
    coverImageUrl: "",
    sourcePlatform: "owned",
    sourceUrl: "",
    audioUrl: "",
    featured: false,
    status: "draft",
    sortOrder: 0,
    contentRights: "unknown",
    rightsConfirmed: false,
    rightsOwner: "",
    licenceInformation: "",
    rightsNotes: "",
    permissionToDistribute: false,
    ...initial,
    categoryId: initial?.categoryId || "",
    audioAssetId: initial?.audioAssetId || "",
    releaseYear: initial?.releaseYear || "",
  });
  const [files, setFiles] = useState<
    { id: string; name: string; url: string }[]
  >([]);
  const [maxBytes, setMaxBytes] = useState(50 * 1024 * 1024);
  const [busy, setBusy] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  useEffect(() => {
    fetch("/api/music/audio")
      .then(async (r) => {
        const b = await r.json();
        if (!r.ok) throw Error(b.message);
        setFiles(b.files);
        setMaxBytes(b.maxBytes);
      })
      .catch((e) => setError(e.message));
  }, []);
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
        !confirm("Discard unsaved music changes?")
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
  function change<K extends keyof FormValue>(key: K, value: FormValue[K]) {
    setItem((v) => ({ ...v, [key]: value }));
    setDirty(true);
  }
  async function upload(file: File, audio: boolean) {
    setError("");
    const limit = audio ? maxBytes : 4 * 1024 * 1024;
    if (file.size > limit) {
      setError(
        `Maximum ${audio ? "audio" : "cover"} size is ${Math.floor(limit / 1024 / 1024)} MB.`,
      );
      return;
    }
    setBusy(true);
    setMessage(`Uploading ${audio ? "audio" : "cover"}… Keep this page open.`);
    try {
      const extension = file.name.split(".").pop()?.toLowerCase();
      const mime =
        file.type ||
        (audio
          ? (
              {
                mp3: "audio/mpeg",
                m4a: "audio/mp4",
                wav: "audio/wav",
              } as Record<string, string>
            )[extension || ""]
          : "");
      const r = await fetch(
        audio ? "/api/music/audio" : "/api/product-images",
        {
          method: "POST",
          headers: {
            "Content-Type": mime,
            "X-File-Name": encodeURIComponent(file.name),
          },
          body: file,
        },
      );
      const b = await r.json();
      if (!r.ok) throw Error(b.message);
      if (audio) {
        setItem((v) => ({ ...v, audioAssetId: b.id, audioUrl: b.url }));
        setFiles((v) => [{ id: b.id, name: file.name, url: b.url }, ...v]);
      } else change("coverImageUrl", b.url);
      setDirty(true);
      setMessage("Upload ready. Save the music item to apply your changes.");
    } catch (e) {
      setError((e as Error).message);
      setMessage("");
    } finally {
      setBusy(false);
    }
  }
  async function save(status: string) {
    setBusy(true);
    setError("");
    setMessage("Saving…");
    try {
      const payload = {
        ...item,
        status,
        releaseYear: item.releaseYear === "" ? null : item.releaseYear,
      };
      await salesFetch(
        item.id ? `/api/music/${item.id}` : "/api/music",
        item.id ? "PUT" : "POST",
        payload,
      );
      setDirty(false);
      router.push("/admin/music?saved=1");
      router.refresh();
    } catch (e) {
      setError((e as Error).message);
      setMessage("");
    } finally {
      setBusy(false);
    }
  }
  return (
    <form
      className="max-w-3xl space-y-5"
      onSubmit={(e) => {
        e.preventDefault();
        const button = (e.nativeEvent as SubmitEvent)
          .submitter as HTMLButtonElement | null;
        void save(
          button?.value && button.value !== "save" ? button.value : item.status,
        );
      }}
    >
      <p className="text-slate-600">
        Upload recordings you own or are licensed to stream. Draft audio is
        private to administrators. This module provides streaming; public
        download links are disabled.
      </p>
      <fieldset disabled={busy} className="space-y-5 disabled:opacity-60">
        <Field label="Song title">
          <input
            className={inputClass}
            required
            minLength={2}
            maxLength={180}
            value={item.title}
            onChange={(e) => change("title", e.target.value)}
          />
        </Field>
        <Field label="Artist, choir or composer">
          <input
            className={inputClass}
            maxLength={160}
            value={item.artistName}
            onChange={(e) => change("artistName", e.target.value)}
          />
        </Field>
        <Field label="Music category">
          <select
            className={inputClass}
            value={item.categoryId}
            onChange={(e) => change("categoryId", e.target.value)}
          >
            <option value="">Uncategorised</option>
            {categories
              .filter((c) => c.isActive || c.id === item.categoryId)
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {!c.isActive ? " (inactive)" : ""}
                </option>
              ))}
          </select>
        </Field>
        <Link href="/admin/music/categories" className="inline-block underline">
          Manage categories
        </Link>
        <Field label="Audio source">
          <select
            className={inputClass}
            value={item.sourcePlatform}
            onChange={(e) => change("sourcePlatform", e.target.value)}
          >
            {musicPlatforms.map((p) => (
              <option key={p} value={p}>
                {p === "owned" ? "Uploaded recording" : p.replaceAll("-", " ")}
              </option>
            ))}
          </select>
        </Field>
        {item.sourcePlatform === "owned" ? (
          <>
            <Field
              label={`Upload audio (MP3, M4A or PCM WAV, maximum ${Math.floor(maxBytes / 1024 / 1024)} MB)`}
            >
              <input
                type="file"
                accept="audio/mpeg,audio/mp4,audio/x-m4a,audio/wav,audio/x-wav,.mp3,.m4a,.wav"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = "";
                  if (f) void upload(f, true);
                }}
              />
            </Field>
            <Field label="Existing audio uploads">
              <select
                className={inputClass}
                value={item.audioAssetId}
                onChange={(e) => {
                  const f = files.find((f) => f.id === e.target.value);
                  if (f) {
                    change("audioAssetId", f.id);
                    change("audioUrl", f.url);
                  }
                }}
              >
                <option value="">Choose a stored recording</option>
                {files.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </Field>
            {item.audioUrl && (
              <div className="rounded-xl border p-4">
                <h2 className="font-bold">Audio preview</h2>
                <MusicPlayer
                  src={item.audioUrl}
                  title={item.title || "Audio preview"}
                />
                <button
                  type="button"
                  className="mt-3 rounded border px-3 py-2"
                  onClick={() => {
                    change("audioAssetId", "");
                    change("audioUrl", "");
                  }}
                >
                  Remove audio association
                </button>
              </div>
            )}
          </>
        ) : (
          <Field label="Official source URL">
            <input
              className={inputClass}
              type="url"
              value={item.sourceUrl}
              onChange={(e) => change("sourceUrl", e.target.value)}
              placeholder="Official YouTube, Spotify or artist page"
            />
          </Field>
        )}
        <Field label="Upload cover image (PNG, JPEG or WebP, maximum 4 MB)">
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void upload(f, false);
            }}
          />
        </Field>
        {item.coverImageUrl && (
          <div>
            <div className="relative size-48 overflow-hidden rounded-xl border">
              <Image
                src={item.coverImageUrl}
                alt="Music cover preview"
                fill
                className="object-contain"
                sizes="192px"
                unoptimized={!item.coverImageUrl.startsWith("/")}
              />
            </div>
            <button
              type="button"
              className="mt-2 rounded border px-3 py-2"
              onClick={() => change("coverImageUrl", "")}
            >
              Remove cover association
            </button>
          </div>
        )}
        <Field label="Cover image URL (optional)">
          <input
            className={inputClass}
            value={item.coverImageUrl}
            onChange={(e) => change("coverImageUrl", e.target.value)}
          />
        </Field>
        <Field label="Short description">
          <textarea
            className={inputClass}
            rows={3}
            maxLength={300}
            value={item.shortDescription}
            onChange={(e) => change("shortDescription", e.target.value)}
          />
        </Field>
        <Field label="Detailed description (optional)">
          <textarea
            className={inputClass}
            rows={5}
            maxLength={10000}
            value={item.description}
            onChange={(e) => change("description", e.target.value)}
          />
        </Field>
        <Field label="Release year (optional)">
          <input
            type="number"
            min={1000}
            max={9999}
            step={1}
            className={inputClass}
            value={item.releaseYear}
            onChange={(e) =>
              change(
                "releaseYear",
                e.target.value === "" ? "" : Number(e.target.value),
              )
            }
          />
        </Field>
        <fieldset className="space-y-4 rounded-xl border p-4">
          <legend className="px-2 font-bold">
            Ownership and licence (admin only)
          </legend>
          <Field label="Rights basis">
            <select
              className={inputClass}
              value={item.contentRights}
              onChange={(e) => change("contentRights", e.target.value)}
            >
              <option value="unknown">Not yet confirmed</option>
              <option value="client-owned">
                Image Grant Technology owns this recording
              </option>
              <option value="licensed">Licensed / permission granted</option>
              <option value="external-official">
                Official external source
              </option>
            </select>
          </Field>
          <Field label="Rights owner (optional)">
            <input
              className={inputClass}
              maxLength={200}
              value={item.rightsOwner}
              onChange={(e) => change("rightsOwner", e.target.value)}
            />
          </Field>
          <Field label="Licence or permission information (optional)">
            <textarea
              className={inputClass}
              maxLength={2000}
              value={item.licenceInformation}
              onChange={(e) => change("licenceInformation", e.target.value)}
            />
          </Field>
          <Field label="Internal rights notes (optional)">
            <textarea
              className={inputClass}
              maxLength={1000}
              value={item.rightsNotes}
              onChange={(e) => change("rightsNotes", e.target.value)}
            />
          </Field>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1"
              checked={item.rightsConfirmed}
              onChange={(e) => change("rightsConfirmed", e.target.checked)}
            />
            I confirm that Image Grant Technology has ownership or permission to
            stream this recording.
          </label>
          <label className="flex items-start gap-3">
            <input
              type="checkbox"
              className="mt-1"
              checked={item.permissionToDistribute}
              onChange={(e) =>
                change("permissionToDistribute", e.target.checked)
              }
            />
            Permission also allows distribution (record only; does not enable
            public downloads).
          </label>
        </fieldset>
        <label className="flex gap-3">
          <input
            type="checkbox"
            checked={item.featured}
            onChange={(e) => change("featured", e.target.checked)}
          />
          Featured music
        </label>
        <Field label="Display order">
          <input
            type="number"
            min={0}
            step={1}
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
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            {item.status === "archived" && (
              <option value="archived">Archived</option>
            )}
          </select>
        </Field>
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
            Publish music
          </button>
          <Link href="/admin/music" className="px-4 py-2 underline">
            Cancel
          </Link>
        </div>
      </fieldset>
      {busy && <p role="status">Working…</p>}
      {message && <p role="status">{message}</p>}
      {error && (
        <p role="alert" className="text-red-700">
          {error}
        </p>
      )}
    </form>
  );
}
