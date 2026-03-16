"use client";

import { createClient } from "@supabase/supabase-js";
import { getClientEnv } from "@/lib/env";

let browserClient: ReturnType<typeof createClient> | null = null;

export function getBrowserSupabaseClient() {
  if (browserClient) {
    return browserClient;
  }

  const env = getClientEnv();

  browserClient = createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );

  return browserClient;
}
