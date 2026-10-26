"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  homepageAccessorySettingsSchema,
  homepageHeroSettingsSchema,
  type HomepageAccessorySettings,
  type HomepageHeroSettings,
} from "@/lib/validations/homepage-accessories";

export function HomepageAccessoriesForm({
  initial,
}: {
  initial: HomepageAccessorySettings;
}) {
  return <HomepageCopyForm initial={initial} kind="accessories" />;
}
export function HomepageHeroForm({
  initial,
}: {
  initial: HomepageHeroSettings;
}) {
  return <HomepageCopyForm initial={initial} kind="hero" />;
}

function HomepageCopyForm({
  initial,
  kind,
}: {
  initial: HomepageAccessorySettings &
    Partial<Pick<HomepageHeroSettings, "headingTwo">>;
  kind: "hero" | "accessories";
}) {
  const isHero = kind === "hero";
  const router = useRouter();
  const schema = isHero
    ? homepageHeroSettingsSchema
    : homepageAccessorySettingsSchema;
  const [value, setValue] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  return (
    <form
      aria-label={
        isHero ? "Homepage hero settings" : "Accessories homepage settings"
      }
      className="space-y-4 rounded-xl border bg-white p-5"
      onSubmit={async (event) => {
        event.preventDefault();
        const parsed = schema.safeParse(value);
        if (!parsed.success) {
          setMessage(
            parsed.error.issues.map((issue) => issue.message).join(" "),
          );
          return;
        }
        setBusy(true);
        setMessage("");
        try {
          const response = await fetch("/api/settings/homepage", {
            method: isHero ? "PATCH" : "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(parsed.data),
          });
          const body = await response.json();
          if (!response.ok)
            throw new Error(
              body.message || "Could not save the homepage section.",
            );
          const persisted = schema.parse(body.data);
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
      <h2 className="text-xl font-bold">
        {isHero ? "Homepage Hero" : "LED Screen Accessories section"}
      </h2>
      <p className="text-sm leading-6 text-slate-600">
        {isHero
          ? "Edit Heading 1 and the optional Heading 2, shown on separate lines above the existing description."
          : "Edit the heading and introductory text above the homepage accessory cards. Individual products are managed in LED Accessories."}
      </p>
      <fieldset disabled={busy} className="space-y-4">
        <label className="block text-sm font-semibold">
          {isHero ? "Heading 1" : "Accessories section heading"}
          <input
            required
            maxLength={160}
            className="mt-2 w-full rounded-lg border p-3"
            value={value.heading}
            onChange={(event) =>
              setValue((previous) => ({
                ...previous,
                heading: event.target.value,
              }))
            }
          />
        </label>
        {isHero && (
          <label className="block text-sm font-semibold">
            Heading 2 (optional)
            <input
              maxLength={160}
              className="mt-2 w-full rounded-lg border p-3"
              value={value.headingTwo ?? ""}
              onChange={(event) =>
                setValue((previous) => ({
                  ...previous,
                  headingTwo: event.target.value,
                }))
              }
            />
          </label>
        )}
        <label className="block text-sm font-semibold">
          {isHero ? "Hero description" : "Accessories section description"}
          <textarea
            required
            rows={4}
            maxLength={2000}
            className="mt-2 w-full rounded-lg border p-3"
            value={value.description}
            onChange={(event) =>
              setValue((previous) => ({
                ...previous,
                description: event.target.value,
              }))
            }
          />
        </label>
        <div className="flex flex-wrap gap-3">
          <button className="rounded-lg bg-[#DD2421] px-5 py-3 font-bold text-white">
            {busy
              ? "Saving…"
              : isHero
                ? "Save hero"
                : "Save accessories section"}
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
          <Link
            href="/"
            target="_blank"
            className="px-4 py-3 font-bold underline"
          >
            View saved homepage
          </Link>
        </div>
      </fieldset>
      <p role="status" className="text-sm">
        {message}
      </p>
    </form>
  );
}
