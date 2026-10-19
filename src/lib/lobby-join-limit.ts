import "server-only";
import { createRateLimiter, type RateLimiter } from "./rate-limit";

/** Lobby code attempts allowed per IP address and per minute (SALLE-10). `LOBBY_CODE_ATTEMPTS_PER_MINUTE` raises it for tests. */
function attemptsPerMinute(): number {
  const configured = Number(process.env.LOBBY_CODE_ATTEMPTS_PER_MINUTE);
  return Number.isInteger(configured) && configured > 0 ? configured : 10;
}

const globalForLimits = globalThis as typeof globalThis & { lobbyCodeLimiter?: RateLimiter };

/** Shared by the join form and lobby links opened by non-members, so guessing codes is slow either way. */
export function lobbyCodeLimiter(): RateLimiter {
  globalForLimits.lobbyCodeLimiter ??= createRateLimiter(attemptsPerMinute(), 60_000);
  return globalForLimits.lobbyCodeLimiter;
}
