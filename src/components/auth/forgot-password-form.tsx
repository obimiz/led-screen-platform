"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

import {
  forgotPasswordSchema,
  type ForgotPasswordInput,
} from "@/lib/validations/auth";

type ForgotResponse = {
  success: boolean;
  message: string;
  data?: { resetUrl?: string };
};

export function ForgotPasswordForm() {
  const [result, setResult] = useState<ForgotResponse | null>(null);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  async function onSubmit(values: ForgotPasswordInput) {
    setResult(null);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const body = (await response.json()) as ForgotResponse;
      if (!response.ok) return setError("root", { message: body.message });
      setResult(body);
    } catch {
      setError("root", {
        message: "Unable to process your request. Please try again.",
      });
    }
  }

  if (result)
    return (
      <div aria-live="polite">
        <p className="rounded-lg bg-success-50 p-3 text-sm leading-6 text-success-800">
          {result.message}
        </p>
        {result.data?.resetUrl && (
          <a
            href={result.data.resetUrl}
            className="mt-4 block text-sm font-semibold break-all text-brand-700 underline"
          >
            Development reset link
          </a>
        )}
        <Link
          href="/admin/login"
          className="mt-6 inline-block text-sm font-semibold text-brand-700"
        >
          Return to sign in
        </Link>
      </div>
    );

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {errors.root && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {errors.root.message}
        </p>
      )}
      <div>
        <label htmlFor="email" className="text-sm font-semibold text-slate-800">
          Email address
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-brand-600 focus:ring-2 focus:ring-brand-100"
        />
        {errors.email && (
          <p
            id="email-error"
            role="alert"
            className="mt-1.5 text-sm text-red-600"
          >
            {errors.email.message}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-bold text-white hover:bg-primary-hover disabled:opacity-60"
      >
        {isSubmitting && <LoaderCircle size={18} className="animate-spin" />}
        {isSubmitting ? "Submitting…" : "Send reset instructions"}
      </button>
      <Link
        href="/admin/login"
        className="block text-center text-sm font-semibold text-brand-700"
      >
        Return to sign in
      </Link>
    </form>
  );
}
