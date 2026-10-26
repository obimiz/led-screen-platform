"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  homepageServicesSettingsSchema,
  type HomepageServicesSettings,
} from "@/lib/validations/homepage-accessories";

export function HomepageServicesForm({
  initial,
}: {
  initial: HomepageServicesSettings;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const inputClass = "mt-2 w-full rounded-lg border p-3";
  return (
    <form
      aria-label="Homepage services settings"
      className="space-y-4 rounded-xl border bg-white p-5"
      onSubmit={async (event) => {
        event.preventDefault();
        const parsed = homepageServicesSettingsSchema.safeParse(value);
        if (!parsed.success) {
          setMessage(
            parsed.error.issues
              .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
              .join(" "),
          );
          return;
        }
        setBusy(true);
        setMessage("");
        try {
          const response = await fetch("/api/settings/homepage", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(parsed.data),
          });
          const body = await response.json();
          if (!response.ok)
            throw new Error(body.message || "Could not save services.");
          const persisted = homepageServicesSettingsSchema.parse(body.data);
          setValue(persisted);
          setSaved(persisted);
          setMessage(body.message);
          router.refresh();
        } catch (error) {
          setMessage((error as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2 className="text-xl font-bold">Our Services section</h2>
      <p className="text-sm text-slate-600">
        Edit the introduction, four service cards and quote button. Links must
        begin with /.
      </p>
      <fieldset disabled={busy} className="space-y-4">
        <label className="block text-sm font-semibold">
          Services section heading
          <input
            required
            maxLength={160}
            className={inputClass}
            value={value.heading}
            onChange={(e) => setValue({ ...value, heading: e.target.value })}
          />
        </label>
        <label className="block text-sm font-semibold">
          Services section description
          <textarea
            required
            maxLength={2000}
            rows={4}
            className={inputClass}
            value={value.description}
            onChange={(e) =>
              setValue({ ...value, description: e.target.value })
            }
          />
        </label>
        {value.items.map((item, index) => (
          <fieldset key={index} className="space-y-3 rounded-lg border p-4">
            <legend className="px-2 font-bold">Service {index + 1}</legend>
            {(["title", "description", "href"] as const).map((key) => (
              <label key={key} className="block text-sm font-semibold">
                Service {index + 1} {key === "href" ? "link" : key}
                {key === "description" ? (
                  <textarea
                    required
                    rows={3}
                    maxLength={2000}
                    className={inputClass}
                    value={item[key]}
                    onChange={(e) =>
                      setValue({
                        ...value,
                        items: value.items.map((row, i) =>
                          i === index ? { ...row, [key]: e.target.value } : row,
                        ),
                      })
                    }
                  />
                ) : (
                  <input
                    required
                    maxLength={key === "href" ? 300 : 160}
                    className={inputClass}
                    value={item[key]}
                    onChange={(e) =>
                      setValue({
                        ...value,
                        items: value.items.map((row, i) =>
                          i === index ? { ...row, [key]: e.target.value } : row,
                        ),
                      })
                    }
                  />
                )}
              </label>
            ))}
          </fieldset>
        ))}
        <label className="block text-sm font-semibold">
          Services button label
          <input
            required
            maxLength={80}
            className={inputClass}
            value={value.buttonLabel}
            onChange={(e) =>
              setValue({ ...value, buttonLabel: e.target.value })
            }
          />
        </label>
        <label className="block text-sm font-semibold">
          Services button link
          <input
            required
            maxLength={300}
            className={inputClass}
            value={value.buttonHref}
            onChange={(e) => setValue({ ...value, buttonHref: e.target.value })}
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <button className="rounded-lg bg-[#DD2421] px-5 py-3 font-bold text-white">
            {busy ? "Saving…" : "Save services section"}
          </button>
          <button
            type="button"
            className="rounded-lg border px-5 py-3"
            onClick={() => {
              setValue(saved);
              setMessage("Unsaved changes discarded.");
            }}
          >
            Discard changes
          </button>
        </div>
      </fieldset>
      <p role="status" className="text-sm">
        {message}
      </p>
    </form>
  );
}
