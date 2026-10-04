# Architecture

## Folder layout

```
src/
  app/                      Next.js App Router (routes, layouts, global CSS only)
    globals.css             Tailwind 4 theme tokens (see design-system.md)
    [locale]/layout.tsx     <html>, fonts, icon font, site header/footer, metadata
    [locale]/page.tsx       Home page: composes feature components
    [locale]/lobby/page.tsx Redirects to the player's current lobby (or home)
    [locale]/lobby/[code]/page.tsx          Live lobby (or a join form for invite links)
    [locale]/lobby/[code]/race/page.tsx     Countdown and live race
    [locale]/lobby/[code]/results/page.tsx  Results of the lobby's last race
    api/lobbies/[code]/events/route.ts      Server-Sent Events stream of lobby snapshots
    api/lobbies/[code]/input/route.ts       Keystroke batches from racers
    [locale]/sign-in/page.tsx       Email/password sign in
    [locale]/sign-up/page.tsx       Account creation
    [locale]/profile/page.tsx       Signed-in player's profile
  components/
    layout/                 Site-wide chrome (header, footer, wordmark)
    ui/                     Generic, reusable primitives (Icon, PlayerAvatar)
  features/<feature>/
    components/             Components used only by that feature (e.g. features/home)
    actions.ts              Server Functions for that feature (e.g. features/auth)
  i18n/                     Locales, dictionaries, message formatting
  lib/                      Framework-free logic (pure functions, db access)
  mocks/                    Placeholder data for features not built yet (header status, mode cards)
  types/                    Shared domain types
public/
  sprites/                  Race runner sprite sheets (see design-system.md)
  music/                    Background music (home themes, race theme); picked by lib/music.ts
tests/
  unit/                     Vitest, pure logic
  e2e/                      Playwright, rendered pages
```

## Rules for placing code

- **Routes stay thin.** `app/**/page.tsx` loads the dictionary and data, then composes components. No business logic there.
- **Business / game logic lives in `src/lib/`** (or a future `src/features/<feature>/logic/`) as pure, typed, tested functions. Example: `lib/radar.ts` computes the radar polygon; `SkillRadar` only renders it.
- **A component used by one feature** goes in `features/<feature>/components/`. Move it to `components/` only once a second feature needs it.
- **Server Components by default.** Add `"use client"` only for components with state or browser events (`StartRaceButton`, `JoinCodeCard`). Pass them translated strings as props; they never load dictionaries.
- **Components receive their dictionary slice** (e.g. `dictionary={home.joinCode}`) typed as `Dictionary["home"]["joinCode"]`, not the whole dictionary.
- **Mock data** is imported only by routes/layouts, never by components, so swapping in real data changes one place.
- File names are kebab-case; exported components are PascalCase.
- Import with the `@/` alias (maps to `src/`).

## Routing

- Every page is under `app/[locale]/`; `locale` is `fr` or `en` (validated with `isLocale`, otherwise `notFound()`).
- `/` redirects to `/fr` (`next.config.ts`).
- Pages are statically generated per locale via `generateStaticParams`.

## Data

- PostgreSQL via `pg`; `lib/db.ts` exposes a lazy `getPool()` (server-only, needs `DATABASE_URL`).
- Schema changes are plain SQL files in `db/migrations/` (`NNN_name.sql`), applied in order by `npm run db:migrate` (`scripts/migrate.mjs`, tracked in `schema_migrations`). Never edit an applied migration; add a new one.
- Local database: `docker compose up -d` (or any Postgres), copy `.env.example` to `.env`, then `npm run db:migrate`.
- Tables: `users` (guests and registered accounts, `kind` column, `character_id` chosen on the profile), `oauth_accounts` (GitHub/Discord identities), `sessions` (only the SHA-256 hash of the cookie token is stored), `race_results` (one row per registered player per finished race).
- `lib/users.ts` is the server-only data access for accounts and sessions. Pure auth helpers (scrypt password hashing, session tokens, input validation) live in `lib/auth/` and are unit tested.
- Lobbies and races are in memory only (see Multiplayer). When a race ends, the store calls `onRaceFinished` and `lib/race-history-db.ts` saves one `race_results` row per registered player (in the background; a database error is only logged). Pure helpers (`recordFromResult`, `summarizeRaces`, guest list parsing) are in `lib/race-history.ts`.
- Guests' races are not stored on the server: the results page saves them in `sessionStorage` (`lib/guest-races.ts`, key `guest-races`, last 50 races), read on the home page with `features/home/use-guest-races.ts`. They are lost when the tab is closed.

## Authentication

- `features/auth/actions.ts`: `signUp`, `signIn`, `signOut` Server Functions used by the forms (`useActionState`). They return error codes, translated by the UI from `auth.errors`.
- `lib/auth/forms.ts`: pure parsing/validation of the submitted forms (unit tested).
- `lib/auth/session.ts` (server-only): `getCurrentUser()` (cached per request), `startSession()`, `endSession()`. Cookie `session`: HttpOnly, `SameSite=Lax`, `Secure` in production, 30 days. Only the token hash is stored.
- Signing up while holding a guest session upgrades that guest row, keeping its history.
- The locale layout reads the current user for the header, so every page renders dynamically. Pages without a session cookie never query the database.
- OAuth (Google, GitHub, Discord): `app/api/auth/[provider]/route.ts` starts the flow (random `state` + PKCE verifier kept in a 10-minute HttpOnly `oauth` cookie) and `.../callback/route.ts` checks the state, exchanges the code, loads the profile and calls `findOrCreateOAuthUser`. Pure helpers (authorize URL, PKCE, profile parsing, username cleanup) are in `lib/auth/oauth.ts`; network calls in `lib/auth/oauth-client.ts`. A provider's button only shows when its `*_CLIENT_ID` and `*_CLIENT_SECRET` are set (see `.env.example`). Callback URL to register with each provider: `{APP_URL}/api/auth/{provider}/callback`.
- To protect a page or action, call `getCurrentUser()` on the server and check `kind`. Never trust client-sent user ids.

## Multiplayer

Lobbies and races run on the server; clients only send keystrokes and render snapshots.

| Layer | File | Role |
| --- | --- | --- |
| Rules | `lib/race-engine.ts` | Pure `(state, event, now) → state` functions: join, leave, ready, add/remove bot, start, input, connect/disconnect, `advance` (time-based transitions and bot keystrokes), `viewFor` (per-player snapshot), `resultFor`. No timers, I/O or transport. |
| Bots | `lib/bots.ts` | `planBotRun(text, difficulty, random)`: a bot's whole race as timed keystrokes, planned at race start. |
| Store | `lib/lobby-store.ts` | `createLobbyStore()`: keeps lobbies in a `Map`, runs one 100 ms timer (countdown end, race end, expired seats), broadcasts to subscribers, counts connections per player. Unit tested with an injected clock. |
| Singleton | `lib/lobby-server.ts` | Server-only `getLobbyStore()`, kept on `globalThis`. Reads `LOBBY_CAPACITY`. |
| Transport | `app/api/lobbies/[code]/*`, `features/lobby/actions.ts` | SSE stream (`events`), keystroke batches (`input`), Server Functions for create/join/leave/ready/start. Swapping SSE for WebSockets only touches this layer. |
| Client | `features/lobby/use-lobby-stream.ts`, `features/race/use-input-sender.ts` | `EventSource` hook (auto-reconnect, server clock offset) and batched, retried keystroke sender. |

**Lifecycle:** `waiting → countdown → racing → finished`, then the next ready or join reopens `waiting` (results are kept). A lobby is deleted (closed) once nobody is left.

- The creator is host; if the host leaves or their seat expires, the longest-standing player takes over. Only the host starts, once at least two players are all ready (`canStartRace`).
- Capacity defaults to 30 (a class), capped at 60, set with `LOBBY_CAPACITY`.
- Start: the server picks a text in the lobby's language (`lib/race-texts.ts`) and sets `startsAt = now + 3 s`. Snapshots carry `serverNow` so every client shows the same countdown.
- Input: the client diffs the hidden input into `char`/`delete` events and posts them in numbered batches (one request at a time, retried with the same number). The server replays them with `lib/typing.ts`, timed by its own clock, and ignores repeated batches, input outside the race and more than 30 keys/s. Progress, WPM, places, finish and results are computed server-side only. Client-measured key delays are used only for the heatmap.
- Progress is broadcast at most every 100 ms per lobby; membership and phase changes are broadcast immediately.
- End: when every racer finished, left, or stayed disconnected past the grace period, or at the 3-minute limit. Results are ranked with `rankRacers`.

**Bots:** the host adds bots from the lobby (one button per difficulty, so every bot can have its own level) and removes them while no race is running. A bot is a lobby member with `bot` set to its difficulty: always connected and ready, never host, counted in the capacity. When the race starts, `planBotRun` plans each bot's keystrokes; `advance` replays the ones that are due with the same typing rules as players (progress, samples, key stats, results). Plans are human-like: target speed per difficulty (`botTargetWpm`, ±8% per race), uneven rhythm, slower capitals and punctuation, short pauses between words, and typos on neighboring QWERTY keys that are sometimes noticed a few keys late, then deleted and retyped. Easier levels make more typos and react more slowly. A single player can race bots. The race ends early once no player is left, and bots are removed when the last player leaves.

**Reconnection:** a player whose stream drops keeps their seat and race progress for 30 s (`reconnectGraceMs`). `EventSource` reconnects on its own and a reload restores the typed text from the snapshot (the input stays read-only until the page is hydrated, so keys typed earlier are not silently dropped). Each page load sends input with its own client id: its first batch takes over and late batches from the previous page are ignored; when idle, the client adopts the server's copy of the typed text. Timers run on the server, so the race never depends on the host's browser.

**Single instance only:** all lobby state lives in the memory of one Node process. Run exactly one app instance (no serverless, no horizontal scaling, no multiple workers behind a load balancer). A restart or deploy ends every lobby. Scaling out later needs shared state (e.g. Redis) behind the same store interface.

**Playing on the local network (dev):** add your LAN IP to `ALLOWED_DEV_ORIGINS` in `.env` (e.g. `ALLOWED_DEV_ORIGINS=10.3.3.55`), restart `next dev`, and share the `Network:` URL. Other devices must be on the same network. Use email/password accounts: OAuth callbacks point to `APP_URL`. `next start` over plain HTTP on an IP does not work for sign-in, because the production session cookie is `Secure`.

In development, editing `race-engine.ts` or `lobby-store.ts` does not update the store already created on `globalThis`: restart `next dev` after such changes.
