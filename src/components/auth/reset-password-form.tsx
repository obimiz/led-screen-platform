"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

import {
  resetPasswordSchema,
  type ResetPasswordInput,
} from "@/lib/validations/auth";

type ResponseBody = { success: boolean; message: string };

export function ResetPasswordForm({ token }: { token: string }) {
  const [complete, setComplete] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token },
  });

  async function onSubmit(values: ResetPasswordInput) {
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const body = (await response.json()) as ResponseBody;
      if (!response.ok) return setError("root", { message: body.message });
      setComplete(true);
    } catch {
      setError("root", {
        message: "Unable to reset your password. Please try again.",
      });
    }
  }

  if (complete)
    return (
      <div aria-live="polite">
        <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">
          Your password has been changed and existing sessions have been
          invalidated.
        </p>
        <Link
          href="/admin/login"
          className="mt-6 inline-block rounded-lg bg-cyan-500 px-4 py-3 font-bold text-slate-950"
        >
          Continue to sign in
        </Link>
      </div>
    );

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      <input type="hidden" {...register("token")} />
      {errors.root && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {errors.root.message}
        </p>
      )}
      <div>
        <label
          htmlFor="password"
          className="text-sm font-semibold text-slate-800"
        >
          New password
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.password)}
          aria-describedby={
            errors.password ? "new-password-error" : "password-help"
          }
          {...register("password")}
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
        />
        <p id="password-help" className="mt-1.5 text-xs text-slate-500">
          At least 8 characters with one letter and one number.
        </p>
        {errors.password && (
          <p
            id="new-password-error"
            role="alert"
            className="mt-1.5 text-sm text-red-600"
          >
            {errors.password.message}
          </p>
        )}
      </div>
      <div>
        <label
          htmlFor="confirmPassword"
          className="text-sm font-semibold text-slate-800"
        >
          Confirm new password
        </label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          aria-invalid={Boolean(errors.confirmPassword)}
          aria-describedby={
            errors.confirmPassword ? "confirm-password-error" : undefined
          }
          {...register("confirmPassword")}
          className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
        />
        {errors.confirmPassword && (
          <p
            id="confirm-password-error"
            role="alert"
            className="mt-1.5 text-sm text-red-600"
          >
            {errors.confirmPassword.message}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-cyan-500 px-4 py-3 font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-60"
      >
        {isSubmitting && <LoaderCircle size={18} className="animate-spin" />}
        {isSubmitting ? "Changing password…" : "Change password"}
      </button>
    </form>
  );
}
