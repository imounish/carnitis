"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";

type AuthGuardMode = "app" | "onboarding";

interface AuthGuardProps {
  mode: AuthGuardMode;
  children: React.ReactNode;
}

export function AuthGuard({ mode, children }: AuthGuardProps) {
  const { session, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    if (isLoading) return;

    if (!session) {
      const next = pathname ? `?next=${encodeURIComponent(pathname)}` : "";
      router.replace(`/sign-in${next}`);
      return;
    }

    if (mode === "app" && !session.user.onboardingCompleted) {
      router.replace("/onboarding");
      return;
    }

    if (mode === "onboarding" && session.user.onboardingCompleted) {
      router.replace("/");
    }
  }, [session, isLoading, mode, pathname, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!session) return null;
  if (mode === "app" && !session.user.onboardingCompleted) return null;
  if (mode === "onboarding" && session.user.onboardingCompleted) return null;

  return <>{children}</>;
}
