"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
export type ContentMedia = {
  coverImageUrl: string;
  coverAlt: string;
  imageUrls: string[];
  imageAlts: string[];
};
export function ContentMediaManager({
  value,
  onChange,
  onBusyChange,
  maxImages = 40,
  autoFeature = false,
}: {
  maxImages?: number;
  autoFeature?: boolean;
  value: ContentMedia;
  onChange: (v: ContentMedia) => void;
  onBusyChange: (v: boolean) => void;
}) {
  const [library, setLibrary] = useState<{ url: string; name: string }[]>([]),
    [selected, setSelected] = useState(""),
    [busy, setBusy] = useState(false),
    [message, setMessage] = useState("");
  useEffect(() => {
    fetch("/api/product-images")
      .then(async (r) => {
        const b = await r.json();
        if (!r.ok) throw Error(b.message);
        setLibrary(b.images);
      })
      .catch((e) => setMessage(e.message));
  }, []);
  function add(url: string, cover = false) {
    if (cover || (autoFeature && !value.coverImageUrl)) onChange({ ...value, coverImageUrl: url });
    else if (!value.imageUrls.includes(url) && value.imageUrls.length < maxImages)
      onChange({
        ...value,
        imageUrls: [...value.imageUrls, url],
        imageAlts: [...value.imageAlts, ""],
      });
  }
  async function upload(files: FileList | null, cover: boolean) {
    if (!files?.length) return;
    const batch = Array.from(files);
    if (!cover && batch.length + value.imageUrls.length > maxImages) {
      setMessage(`Maximum ${maxImages} gallery photographs.`);
      return;
    }
    setBusy(true);
    onBusyChange(true);
    setMessage("Uploading…");
    const uploaded: string[] = [];
    try {
      for (const file of batch) {
        if (file.size > 4 * 1024 * 1024)
          throw Error(`${file.name}: maximum image size is 4 MB.`);
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
        uploaded.push(b.url);
        setLibrary((v) => [{ url: b.url, name: file.name }, ...v]);
      }
      setMessage("Images uploaded. Add alt text and save the record.");
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      if (uploaded.length) {
        if (cover) onChange({ ...value, coverImageUrl: uploaded[0] });
        else
          onChange({
            ...value,
            coverImageUrl: autoFeature && !value.coverImageUrl ? uploaded[0] : value.coverImageUrl,
            imageUrls: [...value.imageUrls, ...uploaded],
            imageAlts: [...value.imageAlts, ...uploaded.map(() => "")],
          });
      }
      setBusy(false);
      onBusyChange(false);
    }
  }
  function move(index: number, offset: number) {
    const urls = [...value.imageUrls],
      alts = [...value.imageAlts],
      to = index + offset;
    [urls[index], urls[to]] = [urls[to], urls[index]];
    [alts[index], alts[to]] = [alts[to] || "", alts[index] || ""];
    onChange({ ...value, imageUrls: urls, imageAlts: alts });
  }
  const image = (url: string, alt: string) => (
    <Image
      src={url}
      alt={alt || "Selected image preview"}
      width={300}
      height={200}
      unoptimized={!url.startsWith("/")}
      className="h-40 w-full rounded-lg bg-slate-50 object-contain"
    />
  );
  return (
    <section className="min-w-0 space-y-4 rounded-xl border p-4">
      <h2 className="text-xl font-bold">Images</h2>
      <p className="text-sm text-slate-600">
        PNG, JPEG or WebP, up to 4 MB each. Removing an association keeps the
        stored image safe for other records.
      </p>
      <fieldset disabled={busy} className="min-w-0 space-y-4">
        <label className="block font-semibold">
          Upload cover image
          <input
            className="mt-2 block max-w-full text-sm"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => {
              void upload(e.target.files, true);
              e.target.value = "";
            }}
          />
        </label>
        {value.coverImageUrl && (
          <div className="space-y-2">
            {image(value.coverImageUrl, value.coverAlt)}
            <label className="block text-sm font-semibold">
              Cover alternative text
              <input
                className="mt-1 w-full rounded border p-2"
                maxLength={300}
                value={value.coverAlt}
                onChange={(e) =>
                  onChange({ ...value, coverAlt: e.target.value })
                }
              />
            </label>
            <button
              className="rounded border px-3 py-2"
              type="button"
              onClick={() =>
                onChange({ ...value, coverImageUrl: "", coverAlt: "" })
              }
            >
              Remove cover
            </button>
          </div>
        )}
        <label className="block font-semibold">
          Upload additional photographs
          <input
            className="mt-2 block max-w-full text-sm"
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp"
            onChange={(e) => {
              void upload(e.target.files, false);
              e.target.value = "";
            }}
          />
        </label>
        <label className="block text-sm">
          Existing image library
          <select
            className="mt-1 w-full rounded border p-2"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
          >
            <option value="">Select an existing image</option>
            {library.map((v, i) => (
              <option key={`${v.url}-${i}`} value={v.url}>
                {v.name}
              </option>
            ))}
          </select>
        </label>
        {selected && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="rounded border px-3 py-2"
              onClick={() => add(selected, true)}
            >
              Use as cover
            </button>
            <button
              type="button"
              className="rounded border px-3 py-2"
              disabled={value.imageUrls.length >= maxImages}
              onClick={() => add(selected)}
            >
              Add to photographs
            </button>
          </div>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          {value.imageUrls.map((url, i) => (
            <div
              key={`${url}-${i}`}
              className="min-w-0 space-y-2 rounded-lg border p-3"
            >
              {image(url, value.imageAlts[i])}
              <label className="block text-sm">
                Photograph {i + 1} alternative text
                <input
                  className="mt-1 w-full rounded border p-2"
                  maxLength={300}
                  value={value.imageAlts[i] || ""}
                  onChange={(e) => {
                    const alts = [...value.imageAlts];
                    alts[i] = e.target.value;
                    onChange({ ...value, imageAlts: alts });
                  }}
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded border p-2"
                  aria-label={`Move photograph ${i + 1} earlier`}
                  disabled={i === 0}
                  onClick={() => move(i, -1)}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="rounded border p-2"
                  aria-label={`Move photograph ${i + 1} later`}
                  disabled={i === value.imageUrls.length - 1}
                  onClick={() => move(i, 1)}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="rounded border p-2"
                  onClick={() =>
                    onChange({
                      ...value,
                      imageUrls: value.imageUrls.filter((_, n) => n !== i),
                      imageAlts: value.imageAlts.filter((_, n) => n !== i),
                    })
                  }
                >
                  Remove photograph {i + 1}
                </button>
              </div>
            </div>
          ))}
        </div>
      </fieldset>
      {message && (
        <p role="status" className="text-sm">
          {message}
        </p>
      )}
    </section>
  );
}
