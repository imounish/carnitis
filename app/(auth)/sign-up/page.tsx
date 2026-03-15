"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthLayout } from "@/components/auth/auth-layout";
import { SocialLoginButtons } from "@/components/auth/social-login-buttons";
import { useAuth } from "@/lib/auth/auth-context";
import type { AuthProvider } from "@/lib/auth/types";

export default function SignUpPage() {
  const { signUpWithPassword, signInWithOAuth, errorMessage, clearError, session } =
    useAuth();
  const [pending, setPending] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    if (!session) return;
    if (!session.user.onboardingCompleted) {
      router.replace("/onboarding");
      return;
    }
    router.replace("/");
  }, [session, router]);

  async function handlePasswordSubmit(values: {
    displayName?: string;
    email: string;
    password: string;
  }) {
    setPending(true);
    clearError();
    const ok = await signUpWithPassword(
      values.email,
      values.password,
      values.displayName || "Driver"
    );
    setPending(false);

    if (ok) {
      router.replace("/onboarding");
    }
  }

  async function handleProviderClick(provider: AuthProvider) {
    setPending(true);
    clearError();
    const ok = await signInWithOAuth(provider);
    setPending(false);

    if (!ok) return;
    router.replace("/onboarding");
  }

  return (
    <AuthLayout
      title="Create account"
      subtitle="Set up your workspace and start tracking your vehicles."
    >
      <div className="space-y-4">
        <AuthForm
          mode="sign_up"
          pending={pending}
          errorMessage={errorMessage}
          onSubmit={handlePasswordSubmit}
        />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">or</span>
          </div>
        </div>

        <SocialLoginButtons pending={pending} onProviderClick={handleProviderClick} />

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/sign-in" className="font-medium text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
