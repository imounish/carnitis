"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface OnboardingFormProps {
  defaultDisplayName: string;
  pending: boolean;
  errorMessage: string | null;
  onSubmit: (input: { displayName: string }) => Promise<void>;
}

export function OnboardingForm({
  defaultDisplayName,
  pending,
  errorMessage,
  onSubmit,
}: OnboardingFormProps) {
  const [displayName, setDisplayName] = React.useState(defaultDisplayName);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await onSubmit({ displayName: displayName.trim() });
  }

  return (
    <Card className="p-5">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="onboarding_display_name">Display Name</Label>
          <Input
            id="onboarding_display_name"
            name="onboarding_display_name"
            autoComplete="name"
            required
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="How should we address you?"
          />
        </div>

        <div aria-live="polite" className="min-h-5 text-sm text-destructive">
          {errorMessage}
        </div>

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Saving..." : "Continue to dashboard"}
        </Button>
      </form>
    </Card>
  );
}
