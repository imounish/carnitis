import { redirect } from "next/navigation";
import { OnboardingPageClient } from "@/components/auth/onboarding-page-client";
import { getServerAuthSession } from "@/lib/auth/server-session";

export default async function OnboardingPage() {
  const session = await getServerAuthSession();

  if (!session) {
    redirect("/sign-in?next=%2Fonboarding");
  }

  if (session.user.onboardingCompleted) {
    redirect("/");
  }

  return <OnboardingPageClient defaultDisplayName={session.user.displayName} />;
}
