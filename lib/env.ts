import { z } from "zod";

const clientEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
});

const serverEnvSchema = clientEnvSchema.extend({
  SUPABASE_SECRET_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_URL: z.string().url(),
  BETTER_AUTH_SECRET: z.string().min(32),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
});

export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

let clientEnvCache: z.infer<typeof clientEnvSchema> | null = null;
let serverEnvCache: z.infer<typeof serverEnvSchema> | null = null;

function formatEnvError(
  target: "client" | "server",
  error: z.ZodError
): never {
  const details = error.issues
    .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
    .join("; ");

  throw new Error(`Invalid ${target} environment configuration: ${details}`);
}

export function parseClientEnv(rawEnv: NodeJS.ProcessEnv = process.env): ClientEnv {
  const parsed = clientEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: rawEnv.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      rawEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });

  if (!parsed.success) {
    return formatEnvError("client", parsed.error);
  }

  return parsed.data;
}

export function getClientEnv() {
  if (clientEnvCache) {
    return clientEnvCache;
  }

  clientEnvCache = parseClientEnv();
  return clientEnvCache;
}

export function parseServerEnv(rawEnv: NodeJS.ProcessEnv = process.env): ServerEnv {
  const parsed = serverEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: rawEnv.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      rawEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    SUPABASE_SECRET_KEY: rawEnv.SUPABASE_SECRET_KEY,
    DATABASE_URL: rawEnv.DATABASE_URL,
    BETTER_AUTH_URL: rawEnv.BETTER_AUTH_URL,
    BETTER_AUTH_SECRET: rawEnv.BETTER_AUTH_SECRET,
    GOOGLE_CLIENT_ID: rawEnv.GOOGLE_CLIENT_ID || undefined,
    GOOGLE_CLIENT_SECRET: rawEnv.GOOGLE_CLIENT_SECRET || undefined,
  });

  if (!parsed.success) {
    return formatEnvError("server", parsed.error);
  }

  return parsed.data;
}

export function getServerEnv() {
  if (serverEnvCache) {
    return serverEnvCache;
  }

  serverEnvCache = parseServerEnv();
  return serverEnvCache;
}
