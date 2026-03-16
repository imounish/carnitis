"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthLayout } from "@/components/auth/auth-layout";
import { SocialLoginButtons } from "@/components/auth/social-login-buttons";
import { useAuth } from "@/lib/auth/auth-context";
import type { AuthProvider } from "@/lib/auth/types";

export function SignInPageClient({ nextPath }: { nextPath: string }) {
  const {
    signInWithPassword,
    signInWithOAuth,
    errorMessage,
    clearError,
    session,
  } = useAuth();
  const [pending, setPending] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    if (!session) return;
    if (!session.user.onboardingCompleted) {
      router.replace("/onboarding");
      return;
    }
    router.replace(nextPath);
  }, [session, router, nextPath]);

  async function handlePasswordSubmit(values: {
    email: string;
    password: string;
  }) {
    setPending(true);
    clearError();
    const ok = await signInWithPassword(values.email, values.password);
    setPending(false);

    if (!ok) return;
    router.replace(nextPath);
  }

  async function handleProviderClick(provider: AuthProvider) {
    setPending(true);
    clearError();
    const ok = await signInWithOAuth(provider);
    setPending(false);

    if (!ok) return;
    router.replace(nextPath);
  }

  return (
    <AuthLayout
      title="Sign in"
      subtitle="Access your vehicles, logs, and maintenance tasks."
    >
      <div className="space-y-4">
        <AuthForm
          mode="sign_in"
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
          New here?{" "}
          <Link href="/sign-up" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
