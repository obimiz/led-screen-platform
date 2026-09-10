import { AuthCard } from "@/components/auth/auth-card";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Reset your password"
      description="Enter your admin email address. The response will not disclose whether an account exists."
    >
      <ForgotPasswordForm />
    </AuthCard>
  );
}
