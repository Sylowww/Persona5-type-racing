import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { FormError } from "@/features/auth/components/form-error";
import { OAuthButtons } from "@/features/auth/components/oauth-buttons";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { SignInForm } from "@/features/auth/components/sign-in-form";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/locales";
import { configuredProviders } from "@/lib/auth/oauth-client";
import { getCurrentUser } from "@/lib/auth/session";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const { auth, metadata } = await getDictionary(locale);
  return { title: `${auth.signIn.metaTitle} - ${metadata.title}` };
}

export default async function SignInPage({
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
      tape={auth.signIn.tape}
      title={auth.signIn.title}
      subtitle={auth.signIn.subtitle}
      switchPrompt={auth.signIn.switchPrompt}
      switchLabel={auth.signIn.switchLink}
      switchHref={`/${locale}/sign-up`}
      preview={auth.preview}
    >
      <div className="flex flex-col gap-4">
        {error === "oauth" && <FormError message={auth.oauth.error} />}
        <OAuthButtons locale={locale} providers={configuredProviders()} dictionary={auth.oauth} />
        <SignInForm locale={locale} dictionary={auth} />
      </div>
    </AuthShell>
  );
}
