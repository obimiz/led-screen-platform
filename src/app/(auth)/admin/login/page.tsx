import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/login-form";

export default function AdminLoginPage() {
  return (
    <AuthCard
      title="Admin sign in"
      description="Use your authorized administrator account to continue."
    >
      <LoginForm />
    </AuthCard>
  );
}
