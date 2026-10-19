// Address of the person behind a request, for invite links (SALLE-04) and rate limits (SALLE-10).

type HeaderReader = { get(name: string): string | null };

/**
 * The client's IP address as seen by the reverse proxy in front of the app (Railway sets `X-Forwarded-For`, whose
 * first entry is the client). Without those headers, every request shares the same "unknown" address.
 */
export function clientIp(headers: HeaderReader): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const real = headers.get("x-real-ip")?.trim();
  return (forwarded || real || "unknown").slice(0, 64);
}
