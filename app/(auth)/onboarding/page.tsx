"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AuthLayout } from "@/components/auth/auth-layout";
import { OnboardingForm } from "@/components/auth/onboarding-form";
import { useAuth } from "@/lib/auth/auth-context";

export default function OnboardingPage() {
  const { session, updateProfile, errorMessage, clearError } = useAuth();
  const [pending, setPending] = React.useState(false);
  const router = useRouter();

  async function handleSubmit(input: { displayName: string }) {
    setPending(true);
    clearError();

    const ok = await updateProfile({
      displayName: input.displayName,
      onboardingCompleted: true,
    });

    setPending(false);

    if (ok) {
      router.replace("/");
    }
  }

  return (
    <AuthGuard mode="onboarding">
      <AuthLayout
        title="Complete your setup"
        subtitle="Confirm your profile details before entering your dashboard."
      >
        <OnboardingForm
          defaultDisplayName={session?.user.displayName || ""}
          pending={pending}
          errorMessage={errorMessage}
          onSubmit={handleSubmit}
        />
      </AuthLayout>
    </AuthGuard>
  );
}
