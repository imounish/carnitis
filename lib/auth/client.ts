"use client";

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient();

export type BetterAuthClientSession = typeof authClient.$Infer.Session;
