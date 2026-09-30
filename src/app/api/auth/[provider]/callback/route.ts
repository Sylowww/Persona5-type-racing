import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { isLocale, type Locale } from "@/i18n/locales";
import { isOAuthProvider, OAUTH_COOKIE } from "@/lib/auth/oauth";
import { callbackUrl, fetchOAuthProfile, getCredentials } from "@/lib/auth/oauth-client";
import { endSession, startSession } from "@/lib/auth/session";
import { findOrCreateOAuthUser } from "@/lib/users";

type PendingFlow = { provider: string; state: string; verifier: string; locale: Locale };

function readPendingFlow(value: string | undefined): PendingFlow | null {
  if (!value) return null;
  try {
    const data: unknown = JSON.parse(value);
    if (typeof data !== "object" || data === null) return null;
    const { provider, state, verifier, locale } = data as Record<string, unknown>;
    if (typeof provider !== "string" || typeof state !== "string" || typeof verifier !== "string") return null;
    return { provider, state, verifier, locale: typeof locale === "string" && isLocale(locale) ? locale : "fr" };
  } catch {
    return null;
  }
}

/** Finishes the OAuth flow: checks state, exchanges the code, signs the user in. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const cookieStore = await cookies();
  const flow = readPendingFlow(cookieStore.get(OAUTH_COOKIE)?.value);
  cookieStore.delete({ name: OAUTH_COOKIE, path: "/api/auth" });

  const locale = flow?.locale ?? "fr";
  const failure = NextResponse.redirect(new URL(`/${locale}/sign-in?error=oauth`, request.url));

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const credentials = isOAuthProvider(provider) ? getCredentials(provider) : null;
  if (!isOAuthProvider(provider) || !credentials || !flow || flow.provider !== provider || !code || state !== flow.state) {
    return failure;
  }

  try {
    const profile = await fetchOAuthProfile(provider, {
      ...credentials,
      code,
      verifier: flow.verifier,
      redirectUri: callbackUrl(provider, request.nextUrl.origin),
    });
    const user = await findOrCreateOAuthUser({
      provider,
      providerAccountId: profile.id,
      username: profile.username,
      email: null,
      avatarUrl: profile.avatarUrl,
    });
    await endSession();
    await startSession(user.id);
  } catch (error) {
    console.error(error);
    return failure;
  }

  return NextResponse.redirect(new URL(`/${locale}`, request.url));
}
