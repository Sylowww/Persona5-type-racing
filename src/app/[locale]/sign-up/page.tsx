import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { FormError } from "@/features/auth/components/form-error";
import { OAuthButtons } from "@/features/auth/components/oauth-buttons";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { SignUpForm } from "@/features/auth/components/sign-up-form";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/locales";
import { configuredProviders } from "@/lib/auth/oauth-client";
import { getCurrentUser } from "@/lib/auth/session";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const { auth, metadata } = await getDictionary(locale);
  return { title: `${auth.signUp.metaTitle} - ${metadata.title}` };
}

export default async function SignUpPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const [{ locale }, { error }] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();

  const user = await getCurrentUser();
  if (user?.kind === "registered") redirect(`/${locale}`);

  const { auth } = await getDictionary(locale);

  return (
    <AuthShell
      tape={auth.signUp.tape}
      title={auth.signUp.title}
      subtitle={auth.signUp.subtitle}
      note={user?.kind === "guest" ? auth.signUp.guestNote : undefined}
      switchPrompt={auth.signUp.switchPrompt}
      switchLabel={auth.signUp.switchLink}
      switchHref={`/${locale}/sign-in`}
      preview={auth.preview}
    >
      <div className="flex flex-col gap-4">
        {error === "oauth" && <FormError message={auth.oauth.error} />}
        <OAuthButtons locale={locale} providers={configuredProviders()} dictionary={auth.oauth} />
        <SignUpForm locale={locale} dictionary={auth} />
      </div>
    </AuthShell>
  );
}
