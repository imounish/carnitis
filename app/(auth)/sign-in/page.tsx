import { redirect } from "next/navigation";
import { SignInPageClient } from "@/components/auth/sign-in-page-client";
import { getAuthPageRedirect } from "@/lib/auth/route-guards";
import { getServerAuthSession } from "@/lib/auth/server-session";

interface SignInPageProps {
  searchParams: Promise<{
    next?: string;
  }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const nextPath = params.next || "/";
  const session = await getServerAuthSession();
  const redirectPath = getAuthPageRedirect(session, nextPath);

  if (redirectPath) {
    redirect(redirectPath);
  }

  return <SignInPageClient nextPath={nextPath} />;
}
