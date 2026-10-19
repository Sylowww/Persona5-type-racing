import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { AuthShell } from "@/features/auth/components/auth-shell";
import { JoinInviteForm } from "@/features/invite/components/join-invite-form";
import { formatMessage } from "@/i18n/format";
import { getDictionary } from "@/i18n/dictionaries";
import { isLocale } from "@/i18n/locales";
import { getCurrentUser } from "@/lib/auth/session";
import { getLobbyStore } from "@/lib/lobby-server";

type Params = { params: Promise<{ locale: string; token: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};

  const { invite, metadata } = await getDictionary(locale);
  return { title: `${invite.metaTitle} - ${metadata.title}` };
}

/** Opened from an invite link (SALLE-04): visitors pick a guest nickname first, then join with one click. */
export default async function InvitePage({ params }: Params) {
  const { locale, token: rawToken } = await params;
  if (!isLocale(locale)) notFound();

  const token = decodeURIComponent(rawToken);
  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/guest?next=${encodeURIComponent(`/${locale}/invite/${rawToken}`)}`);

  const store = getLobbyStore();
  const target = store.inviteTarget(token);
  if (target && store.view(target.code, user.id)) redirect(`/${locale}/lobby/${target.code}`);

  const { invite, auth } = await getDictionary(locale);
  return (
    <AuthShell
      tape={invite.tape}
      title={target ? invite.title : invite.invalidTitle}
      subtitle={target ? formatMessage(invite.subtitle, { host: target.hostName, code: target.code }) : invite.invalidText}
      switchPrompt=""
      switchLabel={invite.home}
      switchHref={`/${locale}`}
      preview={auth.preview}
    >
      {target && <JoinInviteForm token={token} locale={locale} dictionary={invite} />}
    </AuthShell>
  );
}
