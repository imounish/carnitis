export function getBetterAuthTrustedOrigins(baseURL: string) {
  const canonical = new URL(baseURL);
  const origins = new Set([canonical.origin]);

  if (canonical.hostname === "localhost") {
    origins.add(`${canonical.protocol}//127.0.0.1${canonical.port ? `:${canonical.port}` : ""}`);
  }

  if (canonical.hostname === "127.0.0.1") {
    origins.add(`${canonical.protocol}//localhost${canonical.port ? `:${canonical.port}` : ""}`);
  }

  return [...origins];
}
