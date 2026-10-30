import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { GuestForm } from "@/features/auth/components/guest-form";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/locales";
import { safeNextPath } from "@/lib/auth/forms";
import { getCurrentUser } from "@/lib/auth/session";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const { auth, metadata } = await getDictionary(locale);
  return { title: `${auth.guest.metaTitle} - ${metadata.title}` };
}

/** Play without an account: pick a nickname, then go back where the player was heading (`?next=`). */
export default async function GuestPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const [{ locale }, { next: rawNext }] = await Promise.all([params, searchParams]);
  if (!isLocale(locale)) notFound();

  const next = safeNextPath(locale, rawNext);
  if (await getCurrentUser()) redirect(next);

  const { auth } = await getDictionary(locale);
  const signInHref = `/${locale}/sign-in`;

  return (
    <AuthShell
      tape={auth.guest.tape}
      title={auth.guest.title}
      subtitle={auth.guest.subtitle}
      note={auth.guest.limits}
      switchPrompt={auth.guest.switchPrompt}
      switchLabel={auth.guest.switchLink}
      switchHref={signInHref}
      preview={auth.preview}
    >
      <GuestForm locale={locale} next={next} dictionary={auth} />
    </AuthShell>
  );
}
