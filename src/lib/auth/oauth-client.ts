import "server-only";
import { oauthProviders, type OAuthProvider } from "@/types/user";
import { parseProfile, providerConfigs, type OAuthProfile } from "@/lib/auth/oauth";

type Credentials = { clientId: string; clientSecret: string };

const envNames: Record<OAuthProvider, [string, string]> = {
  google: ["GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET"],
  github: ["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET"],
  discord: ["DISCORD_CLIENT_ID", "DISCORD_CLIENT_SECRET"],
};

/** Client credentials from the environment, or null when the provider is not configured. */
export function getCredentials(provider: OAuthProvider): Credentials | null {
  const [idName, secretName] = envNames[provider];
  const clientId = process.env[idName];
  const clientSecret = process.env[secretName];
  return clientId && clientSecret ? { clientId, clientSecret } : null;
}

/** Providers with credentials set; only these get a button. */
export function configuredProviders(): OAuthProvider[] {
  return oauthProviders.filter((provider) => getCredentials(provider) !== null);
}

/** Public origin of the app. Behind a proxy (Railway), the request origin is the internal host, so APP_URL wins. */
export function appOrigin(requestOrigin: string): string {
  return process.env.APP_URL || requestOrigin;
}

export function callbackUrl(provider: OAuthProvider, requestOrigin: string): string {
  return `${appOrigin(requestOrigin)}/api/auth/${provider}/callback`;
}

/** Exchanges the authorization code and loads the provider profile. Throws on any failure. */
export async function fetchOAuthProfile(
  provider: OAuthProvider,
  params: Credentials & { code: string; verifier: string; redirectUri: string },
): Promise<OAuthProfile> {
  const config = providerConfigs[provider];
  const tokenResponse = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code: params.code,
      redirect_uri: params.redirectUri,
      client_id: params.clientId,
      client_secret: params.clientSecret,
      code_verifier: params.verifier,
    }),
    cache: "no-store",
  });
  const token: unknown = await tokenResponse.json();
  const accessToken =
    typeof token === "object" && token !== null && "access_token" in token && typeof token.access_token === "string"
      ? token.access_token
      : null;
  if (!tokenResponse.ok || !accessToken) throw new Error(`${provider} token exchange failed`);

  const profileResponse = await fetch(config.profileUrl, {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json", "User-Agent": "typing-race" },
    cache: "no-store",
  });
  if (!profileResponse.ok) throw new Error(`${provider} profile request failed`);
  const profile = parseProfile(provider, await profileResponse.json());
  if (!profile) throw new Error(`${provider} profile is invalid`);
  return profile;
}
