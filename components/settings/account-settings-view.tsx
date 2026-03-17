"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/auth-context";
import { CheckCircle2, LogOut, Save, UserRound } from "lucide-react";
import { toast } from "sonner";

export function AccountSettingsView() {
  const { user, updateProfile, signOut } = useAuth();
  const [displayName, setDisplayName] = React.useState(user?.displayName ?? "");
  const [saving, setSaving] = React.useState(false);
  const [signingOut, setSigningOut] = React.useState(false);
  const router = useRouter();

  React.useEffect(() => {
    setDisplayName(user?.displayName ?? "");
  }, [user?.displayName]);

  if (!user) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);

    const ok = await updateProfile({ displayName: displayName.trim() });
    setSaving(false);

    if (ok) {
      toast.success("Profile updated.");
      return;
    }

    toast.error("Unable to update profile.");
  }

  async function handleSignOut() {
    setSigningOut(true);
    const ok = await signOut();
    setSigningOut(false);
    if (ok) {
      router.replace("/sign-in");
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-4 pb-24 md:px-6 md:py-6 lg:py-8">
      <header className="mb-5 space-y-1 md:mb-6">
        <h1 className="text-xl font-bold tracking-tight text-foreground md:text-2xl">
          Account Settings
        </h1>
        <p className="text-sm text-muted-foreground">
          Manage your profile and session preferences.
        </p>
      </header>

      <Card className="space-y-4 p-4 md:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserRound className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-card-foreground">Profile</p>
              <p className="text-xs text-muted-foreground">Public-facing account information</p>
            </div>
          </div>
          <Badge variant="secondary" className="text-[10px]">
            <CheckCircle2 className="mr-1 h-3 w-3" />
            {user.onboardingCompleted ? "Onboarding complete" : "Setup pending"}
          </Badge>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="settings_display_name">Display Name</Label>
            <Input
              id="settings_display_name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoComplete="name"
              required
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="settings_email">Email</Label>
            <Input
              id="settings_email"
              value={user.email}
              readOnly
              disabled
              aria-readonly="true"
              className="opacity-80"
            />
          </div>

          <Button type="submit" disabled={saving} className="h-11 w-full sm:w-auto">
            <Save className="mr-1.5 h-4 w-4" />
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </Card>

      <Card className="mt-4 p-4 md:p-5">
        <h2 className="text-sm font-semibold text-card-foreground">Session</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Sign out from this device when you are done.
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={handleSignOut}
          disabled={signingOut}
          className="mt-4 h-11 w-full sm:w-auto"
        >
          <LogOut className="mr-1.5 h-4 w-4" />
          {signingOut ? "Signing out..." : "Sign Out"}
        </Button>
      </Card>
    </div>
  );
}
