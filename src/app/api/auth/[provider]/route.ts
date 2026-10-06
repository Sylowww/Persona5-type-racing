import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { isLocale } from "@/i18n/locales";
import { buildAuthorizeUrl, isOAuthProvider, OAUTH_COOKIE, randomToken } from "@/lib/auth/oauth";
import { appOrigin, callbackUrl, getCredentials } from "@/lib/auth/oauth-client";

const OAUTH_COOKIE_MAX_AGE = 10 * 60;

/** Starts the OAuth flow: stores state + PKCE verifier in a short-lived cookie and redirects to the provider. */
export async function GET(request: NextRequest, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const localeParam = request.nextUrl.searchParams.get("locale") ?? "";
  const locale = isLocale(localeParam) ? localeParam : "fr";
  const credentials = isOAuthProvider(provider) ? getCredentials(provider) : null;
  if (!isOAuthProvider(provider) || !credentials) {
    return NextResponse.redirect(new URL(`/${locale}/sign-in?error=oauth`, appOrigin(request.nextUrl.origin)));
  }

  const state = randomToken();
  const verifier = randomToken();
  (await cookies()).set(OAUTH_COOKIE, JSON.stringify({ provider, state, verifier, locale }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/api/auth",
    maxAge: OAUTH_COOKIE_MAX_AGE,
  });

  return NextResponse.redirect(
    buildAuthorizeUrl(provider, {
      clientId: credentials.clientId,
      redirectUri: callbackUrl(provider, request.nextUrl.origin),
      state,
      verifier,
    }),
  );
}
