import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { SignInForm } from "@/features/auth/components/sign-in-form";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/locales";
import { getCurrentUser } from "@/lib/auth/session";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const { auth, metadata } = await getDictionary(locale);
  return { title: `${auth.signIn.metaTitle} - ${metadata.title}` };
}

export default async function SignInPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
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
      <SignInForm locale={locale} dictionary={auth} />
    </AuthShell>
  );
}
