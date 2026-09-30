import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { SignUpForm } from "@/features/auth/components/sign-up-form";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/locales";
import { getCurrentUser } from "@/lib/auth/session";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const { auth, metadata } = await getDictionary(locale);
  return { title: `${auth.signUp.metaTitle} - ${metadata.title}` };
}

export default async function SignUpPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
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
      <SignUpForm locale={locale} dictionary={auth} />
    </AuthShell>
  );
}
