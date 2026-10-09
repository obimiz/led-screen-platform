"use client";
import { useEffect, useState } from "react";
import { salesFetch } from "@/components/sales/client-api";
import {
  type Organisation,
  type OrganisationValues,
} from "@/lib/validations/organisation";
const blank: OrganisationValues = {
  name: "",
  logoUrl: "",
  location: "",
  website: "",
  displayOrder: 0,
  featured: true,
  active: true,
};
export function OrganisationManager() {
  const [rows, setRows] = useState<Organisation[]>([]),
    [form, setForm] = useState(blank),
    [id, setId] = useState("");
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [loading, setLoading] = useState(true),
    [notice, setNotice] = useState("");
  async function load() {
    setLoading(true);
    try {
      setRows(await salesFetch<Organisation[]>("/api/organisations"));
    } catch {
      setError("Unable to load organisations. Please retry.");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    let cancelled = false;
    salesFetch<Organisation[]>("/api/organisations")
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch(() => {
        if (!cancelled) setError("Unable to load organisations. Please retry.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  function reset() {
    setId("");
    setForm({ ...blank });
  }
  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_1fr]">
      <div>
        {loading ? (
          <p role="status">Loading organisations…</p>
        ) : rows.length ? (
          <ul className="space-y-3">
            {rows.map((row) => (
              <li key={row.id} className="rounded-xl border p-4">
                <p className="font-bold break-words">{row.name}</p>
                <p className="mt-1 text-sm text-slate-600">
                  Order {row.displayOrder} ·{" "}
                  {row.active ? "Active" : "Inactive"} ·{" "}
                  {row.featured ? "Featured" : "Not featured"}
                </p>
                <div className="mt-3 flex gap-4">
                  <button
                    disabled={busy}
                    className="text-brand-700 font-semibold"
                    onClick={() => {
                      const {
                        id: nextId,
                        name,
                        logoUrl,
                        location,
                        website,
                        displayOrder,
                        featured,
                        active,
                      } = row;
                      const values = {
                        name,
                        logoUrl,
                        location,
                        website,
                        displayOrder,
                        featured,
                        active,
                      };
                      setId(nextId);
                      setForm(values);
                      setNotice("");
                    }}
                  >
                    Edit<span className="sr-only"> {row.name}</span>
                  </button>
                  <button
                    disabled={busy}
                    className="text-red-700"
                    onClick={async () => {
                      if (
                        !window.confirm(
                          `Delete ${row.name}? This cannot be undone.`,
                        )
                      )
                        return;
                      setBusy(true);
                      setError("");
                      try {
                        await salesFetch(
                          `/api/organisations/${row.id}`,
                          "DELETE",
                        );
                        if (id === row.id) reset();
                        setNotice("Organisation deleted.");
                        await load();
                      } catch (e) {
                        setError(
                          e instanceof Error ? e.message : "Unable to delete",
                        );
                      } finally {
                        setBusy(false);
                      }
                    }}
                  >
                    Delete<span className="sr-only"> {row.name}</span>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>No organisations yet. Add one using the form.</p>
        )}
        <button
          className="mt-4 text-sm underline"
          disabled={busy || loading}
          onClick={() => {
            setError("");
            void load();
          }}
        >
          Refresh list
        </button>
      </div>
      <form
        className="space-y-4 rounded-xl border p-5"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          setNotice("");
          try {
            await salesFetch(
              `/api/organisations${id ? `/${id}` : ""}`,
              id ? "PUT" : "POST",
              form,
            );
            reset();
            setNotice("Organisation saved.");
            await load();
          } catch (e) {
            setError(e instanceof Error ? e.message : "Unable to save");
          } finally {
            setBusy(false);
          }
        }}
      >
        <h2 className="text-xl font-bold">
          {id ? "Edit organisation" : "Add organisation"}
        </h2>
        <fieldset disabled={busy} className="space-y-4">
          {(
            [
              ["name", "Organisation Name"],
              ["logoUrl", "Logo URL or local path"],
              ["location", "Location"],
              ["website", "Official website"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="block text-sm font-semibold">
              {label}
              {key === "name" && " *"}
              <input
                className="mt-2 w-full rounded-lg border p-2.5"
                value={form[key]}
                required={key === "name"}
                maxLength={key === "name" || key === "location" ? 180 : 2000}
                type={key === "website" ? "url" : "text"}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              />
            </label>
          ))}
          <p className="text-xs text-slate-500">
            Logo is optional. Use an official supplied asset, for example
            /images/clients/organisation.png.
          </p>
          <label className="block text-sm font-semibold">
            Display Order
            <input
              type="number"
              min="0"
              max="10000"
              required
              className="mt-2 w-full rounded-lg border p-2.5"
              value={form.displayOrder}
              onChange={(e) =>
                setForm({ ...form, displayOrder: Number(e.target.value) })
              }
            />
          </label>
          {(["featured", "active"] as const).map((key) => (
            <label key={key} className="flex gap-2 capitalize">
              <input
                type="checkbox"
                checked={form[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
              />
              {key}
            </label>
          ))}
          <div className="flex flex-wrap gap-4">
            <button className="bg-brand-700 rounded-lg px-5 py-3 font-bold text-white">
              {busy ? "Saving…" : "Save organisation"}
            </button>
            {id && (
              <button type="button" onClick={reset}>
                Cancel edit
              </button>
            )}
          </div>
        </fieldset>
        {error && (
          <p role="alert" className="text-red-700">
            {error}
          </p>
        )}
        <p role="status" className="text-sm">
          {notice}
        </p>
      </form>
    </div>
  );
}
