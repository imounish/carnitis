"use client";

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: "/api/auth",
});

export type BetterAuthClientSession = typeof authClient.$Infer.Session;
