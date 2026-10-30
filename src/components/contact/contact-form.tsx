"use client";
import { useState } from "react";
export function ContactForm() {
  const [v, setV] = useState({
    name: "",
    email: "",
    phone: "",
    whatsappNumber: "",
    enquiryType: "general",
    preferredContactMethod: "any",
    subject: "",
    message: "",
    source: "contact-page",
    sourcePage: "/contact",
    honeypot: "",
    idempotencyKey: "",
  });
  const [done, setDone] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const change = (e: any) =>
    setV((x) => ({ ...x, [e.target.name]: e.target.value }));
  return done ? (
    <div className="bg-success-50 rounded-xl p-5">
      <meta name="robots" content="noindex, nofollow" />
      <h2 className="font-bold">Your enquiry has been received.</h2>
      <p className="mt-2">
        Reference: <strong>{done}</strong>
      </p>
    </div>
  ) : (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError("");
        try {
          const r = await fetch("/api/contact-enquiries", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              ...v,
              idempotencyKey: crypto.randomUUID() + crypto.randomUUID(),
            }),
          });
          const d = await r.json();
          if (!r.ok) throw new Error(d.message);
          setDone(d.data.referenceNumber);
        } catch (x) {
          setError(
            x instanceof Error
              ? x.message
              : "We couldn't send your enquiry. Please try again.",
          );
          setBusy(false);
        }
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {["name", "email", "phone", "whatsappNumber"].map((n) => (
          <input
            key={n}
            name={n}
            type={n === "email" ? "email" : "text"}
            value={(v as any)[n]}
            onChange={change}
            required={n === "name"}
            placeholder={n.replace(/([A-Z])/g, " $1")}
            className="rounded-lg border px-3 py-2"
          />
        ))}
      </div>
      <select
        name="enquiryType"
        value={v.enquiryType}
        onChange={change}
        className="w-full rounded-lg border px-3 py-2"
      >
        <option value="general">General enquiry</option>
        <option value="product">Product</option>
        <option value="sales">Sales</option>
        <option value="rental">Rental</option>
        <option value="installation">Installation</option>
        <option value="maintenance">Maintenance</option>
        <option value="bell-alarm">Bell & Alarm</option>
        <option value="order">Order support</option>
      </select>
      <select
        name="preferredContactMethod"
        value={v.preferredContactMethod}
        onChange={change}
        className="w-full rounded-lg border px-3 py-2"
      >
        <option value="any">Any contact method</option>
        <option value="whatsapp">WhatsApp</option>
        <option value="phone">Phone</option>
        <option value="email">Email</option>
      </select>
      <input
        name="subject"
        required
        value={v.subject}
        onChange={change}
        placeholder="Subject"
        className="w-full rounded-lg border px-3 py-2"
      />
      <textarea
        name="message"
        required
        minLength={10}
        value={v.message}
        onChange={change}
        placeholder="How can we help?"
        rows={6}
        className="w-full rounded-lg border px-3 py-2"
      />
      <input
        aria-hidden="true"
        tabIndex={-1}
        name="honeypot"
        value={v.honeypot}
        onChange={change}
        className="absolute -left-[9999px]"
      />
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button
        disabled={busy}
        className="bg-primary rounded-lg px-5 py-3 font-bold"
      >
        {busy ? "Sending…" : "Send Enquiry"}
      </button>
    </form>
  );
}
