"use client";

import { Button } from "@/components/ui/button";
import type { AuthProvider } from "@/lib/auth/types";

interface SocialLoginButtonsProps {
  pending: boolean;
  onProviderClick: (provider: AuthProvider) => Promise<void>;
}

const PROVIDERS: Array<{ provider: AuthProvider; label: string }> = [
  { provider: "google", label: "Continue with Google" },
];

export function SocialLoginButtons({
  pending,
  onProviderClick,
}: SocialLoginButtonsProps) {
  return (
    <div className="space-y-2">
      {PROVIDERS.map((item) => (
        <Button
          key={item.provider}
          type="button"
          variant="outline"
          className="w-full"
          disabled={pending}
          onClick={() => onProviderClick(item.provider)}
          aria-label={item.label}
        >
          {item.label}
        </Button>
      ))}
    </div>
  );
}
