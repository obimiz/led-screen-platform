import { AuthCard } from "@/components/auth/auth-card";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <AuthCard
      title="Choose a new password"
      description="Reset links expire after 30 minutes and can only be used once."
    >
      <ResetPasswordForm token={token} />
    </AuthCard>
  );
}
