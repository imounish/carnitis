"use client";

import { useRouter } from "next/navigation";
import * as React from "react";
import { AuthLayout } from "@/components/auth/auth-layout";
import { OnboardingForm } from "@/components/auth/onboarding-form";
import { useAuth } from "@/lib/auth/auth-context";

export function OnboardingPageClient({
  defaultDisplayName,
}: {
  defaultDisplayName: string;
}) {
  const { updateProfile, errorMessage, clearError } = useAuth();
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
    <AuthLayout
      title="Complete your setup"
      subtitle="Confirm your profile details before entering your dashboard."
    >
      <OnboardingForm
        defaultDisplayName={defaultDisplayName}
        pending={pending}
        errorMessage={errorMessage}
        onSubmit={handleSubmit}
      />
    </AuthLayout>
  );
}
