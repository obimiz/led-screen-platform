import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";

const loginErrorMessages: Record<string, string> = {
  invalid: "Invalid email or password",
  rateLimit: "Too many requests. Please try again later.",
  unavailable: "Unable to sign in right now. Please try again.",
};

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const error = (await searchParams).error;
  const initialError =
    typeof error === "string" ? loginErrorMessages[error] : undefined;
  return (
    <AuthCard
      title="Admin sign in"
      description="Use your authorized administrator account to continue."
    >
      <LoginForm initialError={initialError} />
    </AuthCard>
  );
}
