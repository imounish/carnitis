import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { getBetterAuthTrustedOrigins } from "@/lib/auth/auth-origins";
import { getServerEnv } from "@/lib/env";
import { getKyselyDb } from "@/lib/kysely";

const env = getServerEnv();

export const auth = betterAuth({
  appName: "Carnitis",
  baseURL: env.BETTER_AUTH_URL,
  secret: env.BETTER_AUTH_SECRET,
  database: {
    db: getKyselyDb(),
    type: "postgres",
  },
  emailAndPassword: {
    enabled: true,
  },
  socialProviders:
    env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET
      ? {
          google: {
            clientId: env.GOOGLE_CLIENT_ID,
            clientSecret: env.GOOGLE_CLIENT_SECRET,
          },
        }
      : undefined,
  trustedOrigins: getBetterAuthTrustedOrigins(env.BETTER_AUTH_URL),
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
  },
  advanced: {
    useSecureCookies: env.BETTER_AUTH_URL.startsWith("https://"),
  },
  plugins: [nextCookies()],
});

export type BetterAuthSession = typeof auth.$Infer.Session;
export type BetterAuthSessionUser = typeof auth.$Infer.Session.user;
