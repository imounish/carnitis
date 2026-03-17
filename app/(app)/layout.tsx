import { redirect } from "next/navigation";
import { AuthProvider } from "@/lib/auth/auth-context";
import { getProtectedAppRedirect } from "@/lib/auth/route-guards";
import { getServerAuthSession } from "@/lib/auth/server-session";

export default async function AppGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerAuthSession();
  const redirectPath = getProtectedAppRedirect(session);

  if (redirectPath) {
    redirect(redirectPath);
  }

  return <AuthProvider initialSession={session}>{children}</AuthProvider>;
}
