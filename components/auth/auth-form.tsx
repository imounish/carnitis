"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface AuthFormValues {
  displayName?: string;
  email: string;
  password: string;
}

interface AuthFormProps {
  mode: "sign_in" | "sign_up";
  pending: boolean;
  errorMessage: string | null;
  onSubmit: (values: AuthFormValues) => Promise<void>;
}

export function AuthForm({ mode, pending, errorMessage, onSubmit }: AuthFormProps) {
  const [displayName, setDisplayName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");

  const isSignUp = mode === "sign_up";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    await onSubmit({
      displayName: isSignUp ? displayName.trim() : undefined,
      email: email.trim(),
      password,
    });
  }

  return (
    <Card className="p-5">
      <form onSubmit={handleSubmit} className="space-y-4">
        {isSignUp && (
          <div className="space-y-1.5">
            <Label htmlFor="display_name">Display Name</Label>
            <Input
              id="display_name"
              name="display_name"
              autoComplete="name"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Alex Driver"
            />
          </div>
        )}

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete={isSignUp ? "new-password" : "current-password"}
            minLength={8}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isSignUp ? "At least 8 characters" : "Enter your password"}
          />
        </div>

        <div aria-live="polite" className="min-h-5 text-sm text-destructive">
          {errorMessage}
        </div>

        <Button type="submit" className="w-full" disabled={pending}>
          {pending
            ? "Please wait..."
            : isSignUp
              ? "Create account"
              : "Sign in"}
        </Button>
      </form>
    </Card>
  );
}
