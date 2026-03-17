import { redirect } from "next/navigation";
import { SignUpPageClient } from "@/components/auth/sign-up-page-client";
import { getAuthPageRedirect } from "@/lib/auth/route-guards";
import { getServerAuthSession } from "@/lib/auth/server-session";

export default async function SignUpPage() {
  const session = await getServerAuthSession();
  const redirectPath = getAuthPageRedirect(session);

  if (redirectPath) {
    redirect(redirectPath);
  }

  return <SignUpPageClient />;
}
