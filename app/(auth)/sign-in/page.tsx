import { SignInPageClient } from "@/components/auth/sign-in-page-client";

interface SignInPageProps {
  searchParams: Promise<{
    next?: string;
  }>;
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const params = await searchParams;
  const nextPath = params.next || "/";

  return <SignInPageClient nextPath={nextPath} />;
}
