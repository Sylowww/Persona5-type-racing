// Sliding-window rate limits kept in memory, like lobbies (single instance).

export type RateLimiter = {
  /** Records an attempt for `key`; false when it is over the limit (the attempt is not counted then). */
  allow(key: string): boolean;
};

/** At most `limit` attempts per `windowMs` for each key, e.g. lobby code guesses per IP address (SALLE-10). */
export function createRateLimiter(limit: number, windowMs: number, now: () => number = Date.now): RateLimiter {
  const attempts = new Map<string, number[]>();

  function recent(key: string, time: number): number[] {
    return (attempts.get(key) ?? []).filter((at) => time - at < windowMs);
  }

  return {
    allow(key) {
      const time = now();
      // Forget idle keys now and then so the map does not grow forever.
      if (attempts.size > 10_000) for (const stale of attempts.keys()) if (recent(stale, time).length === 0) attempts.delete(stale);
      const kept = recent(key, time);
      if (kept.length >= limit) {
        attempts.set(key, kept);
        return false;
      }
      attempts.set(key, [...kept, time]);
      return true;
    },
  };
}
