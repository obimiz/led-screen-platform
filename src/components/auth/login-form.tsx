"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { loginSchema, type LoginInput } from "@/lib/validations/auth";

type ResponseBody = { success: boolean; message: string };

export function LoginForm({ initialError }: { initialError?: string }) {
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const body = (await response.json()) as ResponseBody;
      if (!response.ok || !body.success) {
        setError("root", { message: body.message });
        return;
      }
      // The login API changes an HttpOnly cookie outside a Server Action.
      // Request a fresh document so a cached signed-out layout cannot be reused.
      window.location.replace("/admin");
    } catch {
      setError("root", { message: "Unable to sign in. Please try again." });
    }
  }

  return (
    <form
      action="/api/auth/login"
      method="post"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="space-y-5"
    >
      {(errors.root || initialError) && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700"
        >
          {errors.root?.message || initialError}
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
          className="focus:border-brand-600 focus:ring-brand-100 mt-2 w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:ring-2"
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
      <div>
        <div className="flex items-center justify-between">
          <label
            htmlFor="password"
            className="text-sm font-semibold text-slate-800"
          >
            Password
          </label>
          <Link
            href="/admin/forgot-password"
            className="text-brand-700 hover:text-brand-600 text-sm font-semibold"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative mt-2">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password")}
            className="focus:border-brand-600 focus:ring-brand-100 w-full rounded-lg border border-slate-300 px-3 py-2.5 pr-11 outline-none focus:ring-2"
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute inset-y-0 right-0 grid w-11 place-items-center text-slate-500 hover:text-slate-800"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        {errors.password && (
          <p
            id="password-error"
            role="alert"
            className="mt-1.5 text-sm text-red-600"
          >
            {errors.password.message}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-primary hover:bg-primary-hover focus-visible:outline-brand-600 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting && (
          <LoaderCircle size={18} className="animate-spin" aria-hidden="true" />
        )}
        {isSubmitting ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
