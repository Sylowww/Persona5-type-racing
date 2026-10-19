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
    [locale]/lobbies/page.tsx       Lobby browser: public custom lobbies, refreshed every 5 s
    [locale]/quick/page.tsx         Quick 1v1 matchmaking (searching screen)
    [locale]/leaderboard/page.tsx   Top 100 registered players, 10 per page (`?page=`)
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
- `/` redirects to the saved language (`locale` cookie), else the browser language (`Accept-Language`), else `/fr` (`proxy.ts`, `preferredLocale` in `i18n/locales.ts`).
- Pages are statically generated per locale via `generateStaticParams`.

## Data

- PostgreSQL through the Drizzle ORM (`drizzle-orm` over the `pg` driver). `lib/db.ts` exposes a lazy `getDb()` (server-only, needs `DATABASE_URL`); queries use the Drizzle query builder, never raw SQL strings.
- `lib/db-schema.ts` holds the typed table models. Schema changes are still plain SQL files in `db/migrations/` (`NNN_name.sql`), applied in order by `npm run db:migrate` (`scripts/migrate.mjs`, tracked in `schema_migrations`). A schema change is a new migration plus the matching edit in `lib/db-schema.ts`. Never edit an applied migration; add a new one.
- Local database: `docker compose up -d` (or any Postgres), copy `.env.example` to `.env`, then `npm run db:migrate`. `npm run db:seed` (`scripts/seed.ts`) then adds demo data: the race text corpus and the demo account from the README, with no races so its stats stay empty until someone plays; `npm run db:seed -- --rivals` also creates five rival accounts with 15 past races each (local use: production has real players). It can be run again: texts are upserted and only the seed accounts (emails at `demo.typestrike.test`) are recreated, so running it again also resets the demo account's races, and running it without `--rivals` removes earlier rivals.
- `scripts/*.ts` run directly with Node's built-in TypeScript support (Node 22.18+), so they import app modules with a `.ts` extension and no `@/` alias.
- Tables: `users` (guests and registered accounts, `kind` column, `character_id` chosen on the profile), `oauth_accounts` (GitHub/Discord identities), `sessions` (only the SHA-256 hash of the cookie token is stored), `race_results` (one row per registered player per finished race), `user_avatars` (uploaded profile pictures), `race_texts` (corpus of coherent texts per language, filled by the seed; races still pick from the built-in list in `lib/race-texts.ts` until CONF-03 is wired).
- Leaderboard: `lib/leaderboard-db.ts` (server-only) ranks registered players with at least one saved race by record WPM, then average WPM, then name, and reads one page of 10 at a time (`LIMIT`/`OFFSET`, top 100 only). Page math and `?page=` parsing are pure, in `lib/leaderboard.ts`.
- `lib/users.ts` is the server-only data access for accounts and sessions. Pure auth helpers (scrypt password hashing, session tokens, input validation) live in `lib/auth/` and are unit tested.
- Profile edits (`features/profile/actions.ts`): `changeUsername` validates like sign-up and relies on the unique index for taken names (`renameUser`); the new name shows at once in the player's current lobby (`store.setName`). `uploadAvatar` checks the size, then the real type from the file's first bytes (`lib/avatar.ts`: JPEG, PNG or WebP, 2 MB max; the browser's type and file name are ignored), stores the bytes in `user_avatars` (the server disk is not persistent) and sets `users.avatar_url` to `/api/avatars/{userId}/{version}`. That route serves the bytes with `nosniff` and an immutable cache (the version changes on every upload). `PlayerAvatar` displays it with `next/image`, which resizes it. Server Action bodies are capped at 3 MB in `next.config.ts`.
- Lobbies and races are in memory only (see Multiplayer). When a race ends, the store calls `onRaceFinished` and `lib/race-history-db.ts` saves one `race_results` row per registered player (in the background; a database error is only logged). Pure helpers (`recordFromResult`, `summarizeRaces`, guest list parsing) are in `lib/race-history.ts`.
- Guests' races are not stored on the server: the results page saves them in `sessionStorage` (`lib/guest-races.ts`, key `guest-races`, last 50 races), read on the home page with `features/home/use-guest-races.ts`. They are lost when the tab is closed.

## Authentication

- `features/auth/actions.ts`: `signUp`, `signIn`, `continueAsGuest`, `signOut` Server Functions used by the forms (`useActionState`). They return error codes, translated by the UI from `auth.errors`.
- `lib/auth/forms.ts`: pure parsing/validation of the submitted forms (unit tested).
- `lib/auth/session.ts` (server-only): `getCurrentUser()` (cached per request), `startSession()`, `endSession()`. Cookie `session`: HttpOnly, `SameSite=Lax`, `Secure` in production, 30 days. Only the token hash is stored.
- Guests (AUTH-02/03): a visitor who opens a lobby, the lobby browser or quick play, or joins with a code, is sent to `/[locale]/guest?next=…` to pick a nickname (username rules, may repeat). `continueAsGuest` creates a `guest` user and the same session cookie, then returns to `next` (checked by `safeNextPath`: same-language app paths only) and joins the lobby when `next` is one. Guests can join but not open lobbies or the dojo (`requireHost` sends them to sign up), have no profile page or picture (the header shows an avatar generated from their name, `generatedAvatar` in `lib/avatar.ts`), and their races are not saved (`saveRaceResults` keeps registered players only).
- Signing up while holding a guest session upgrades that guest row instead of creating a new one.
- The locale layout reads the current user for the header, so every page renders dynamically. Pages without a session cookie never query the database.
- OAuth (Google, GitHub, Discord): `app/api/auth/[provider]/route.ts` starts the flow (random `state` + PKCE verifier kept in a 10-minute HttpOnly `oauth` cookie) and `.../callback/route.ts` checks the state, exchanges the code, loads the profile and calls `findOrCreateOAuthUser`. Pure helpers (authorize URL, PKCE, profile parsing, username cleanup) are in `lib/auth/oauth.ts`; network calls in `lib/auth/oauth-client.ts`. A provider's button only shows when its `*_CLIENT_ID` and `*_CLIENT_SECRET` are set (see `.env.example`). Callback URL to register with each provider: `{APP_URL}/api/auth/{provider}/callback`.
- To protect a page or action, call `getCurrentUser()` on the server and check `kind`. Never trust client-sent user ids.

## Multiplayer

Lobbies and races run on the server; clients only send keystrokes and render snapshots.

| Layer | File | Role |
| --- | --- | --- |
| Rules | `lib/race-engine.ts` | Pure `(state, event, now) → state` functions: join, leave, ready, add/remove bot, start, input, connect/disconnect, `advance` (time-based transitions and bot keystrokes), `viewFor` (per-player snapshot), `resultFor`. No timers, I/O or transport. |
| Settings / chat | `lib/race-settings.ts`, `lib/chat.ts` | Race settings (defaults, allowed values, validation of client changes) and chat message cleanup and limits. |
| Bots | `lib/bots.ts` | `planBotRun(text, difficulty, random)`: a bot's whole race as timed keystrokes, planned at race start. |
| Store | `lib/lobby-store.ts` | `createLobbyStore()`: keeps lobbies in a `Map`, runs one 100 ms timer (countdown end, race end, expired seats), broadcasts to subscribers, counts connections per player. Unit tested with an injected clock. |
| Singleton | `lib/lobby-server.ts` | Server-only `getLobbyStore()`, kept on `globalThis`. Reads `LOBBY_CAPACITY`. |
| Transport | `app/api/lobbies/[code]/*`, `features/lobby/actions.ts` | SSE stream (`events`), keystroke batches (`input`), Server Functions for create/join/leave/ready/start. Swapping SSE for WebSockets only touches this layer. |
| Client | `features/lobby/use-lobby-stream.ts`, `features/race/use-input-sender.ts` | `EventSource` hook (auto-reconnect, server clock offset) and batched, retried keystroke sender. |

**Lobby kinds** (`LobbyKind`): `custom` (the home "Start a race" button, joined with its code), `quick` (a 1v1 made by matchmaking, 30 s race, capacity 2) and `training` (the dojo: one player, no bots, starts without readying up, never saved). Quick and training lobbies refuse code joins (`privateLobby`); both start their race as soon as they are created (`startPrivateRace` in the store).

**Visibility** (`LobbyVisibility`, SALLE-03): custom lobbies start `code` (not listed; joined with the code or an invite link). The host switches them to `public` (also listed by `store.listPublic()` on `/lobbies`, open lobbies first, then the fullest, and joined from there with `joinListedLobby`) or `private` (invite links only: `joinLobby` refuses the code with `privateLobby`). Quick and training lobbies are always private.

**Invite links** (SALLE-04): the host creates links from the lobby's invite panel (`createInvite`; token: 128 random bits from Web Crypto, made by the store). `/[locale]/invite/[token]` shows who invites to which lobby (visitors pick a guest nickname first) and joins with `joinWithInviteLink`, which passes the request's address (`clientIp`: first `X-Forwarded-For` entry). The first use binds the link to that user and address (`joinWithInvite`); afterwards only that address gets in, whatever the visibility. Kicking a player revokes their link; links live in the lobby state, so they die with it. The host's snapshot lists the links (`invites`: token, used by whom, revoked); everyone else gets `null`, and addresses are never sent.

**Spectators** (SALLE-01, SALLE-05): members have a `role`. `player` members (bots included) take the seats and race; `spectator` members take no seat, never ready up, and watch the track without the typing area on the race page (no `race.you`). Any member of a custom lobby switches with `setRole` while it waits (taking a seat needs a free one). Once the seats are taken, newcomers join as spectators, up to `MAX_SPECTATORS` (30). A race needs two racers with at least one human (`canStartRace`) and stops once no human racer is left, even with spectators watching.

**Host controls**: kick (`kickMember`: the player leaves, joins `kicked` so the code and their link refuse them, SALLE-07), close (`closeLobby`, outside a race: everyone gets a null view and the lobby is deleted, COURSE-11), seats (`setCapacity`, 2 to 30) and the rules. Every one checks `hostId` on the server (SEC-01).

**Code guessing** (SALLE-10): `lobbyCodeLimiter()` allows 10 code attempts per minute per address, counted on the join form and when a non-member opens a lobby URL (whether the lobby exists or not). `LOBBY_CODE_ATTEMPTS_PER_MINUTE` raises it for the E2E server.

**Quick 1v1 matchmaking** (`lobby-store.ts`, `lib/matchmaking.ts`): the `/quick` page joins a queue (`joinQuickMatch`) and checks in every second (`checkQuickMatch`). A player is paired with the first other player searching in the same language; after 15 s alone they race a bot whose level is closest to their average WPM (`botForSpeed`). Leaving the page or not checking in for 5 s removes them from the queue. The queue lives in memory like lobbies. Once matched, the status lists both racers (viewer first) for the versus screen (`features/quick/components/versus-screen.tsx`, 2.6 s); quick races start their countdown 3 s later than usual (`QUICK_MATCH_INTRO_MS`) so the screen does not eat it.

**Lifecycle:** `waiting → countdown → racing → finished`, then the next ready or join reopens `waiting` (results are kept). A lobby is deleted (closed) once nobody is left.

- The creator (a registered player) is host; if the host leaves or their seat expires, the longest-standing connected person (player or spectator) takes over. Only the host starts, once at least two racers, one of them human, are all ready (`canStartRace`).
- Capacity (SALLE-05): 30 seats by default (a class; `LOBBY_CAPACITY` can lower the default). The host of a custom lobby changes it from 2 to 30 in the settings panel (`setCapacity`), never below the players already in.
- Settings: the host changes the next race's rules while the lobby is waiting (`updateSettings`; every field is validated server-side): text language (`fr` or `en`, defaults to the host's interface language when the lobby is created), mode (`normal` or `suddenDeath`: the first wrong character eliminates the racer), powers (catch-up bonuses, see below), time limit (30 s, 1, 2, 3, 5 or 10 min, or none: untimed races still stop after a 30-minute safety cap), text type, length, complexity, punctuation, capitals, accents, letters to include or leave out (random texts), numbers (texts with digits) and case sensitivity (when off, a letter in the wrong case is stored as the expected one with `normalizeTypedChar`, on the server and in the race page). A race copies the settings when it starts.
- Error modes (`RaceSettings.mode`, CONF-08): `normal` (a wrong character stays and must be erased to finish), `blocking` (a wrong key is counted but not typed, so the cursor waits for the right one), `free` (the wrong character stays and the racer keeps going; the race ends at the last character, net WPM counts characters at their right place, progress counts typed characters) and `suddenDeath`. `lib/typing.ts` applies them on the server and in the race page; bots plan their typos for the mode (`planBotRun`).
- Forfeit (COURSE-07): `forfeitRace` marks the racer out; they stop typing and watch. At the end every racer gets a status (`finished`, `timeout`, `eliminated`, `forfeited`; leaving or staying disconnected past the grace period counts as `forfeited`), raw WPM, mistakes, progress and time, and `rankRacers` orders them (COURSE-10): finishers by time, then the rest by progress, then eliminations, then forfeits. The results page shows them all in a table (RES-02).
- Paste and drop are blocked in the typing area (COURSE-04).
- Catch-up bonuses (`lib/bonuses.ts`, `applyCatchUp` in the engine; on when the host turns Powers on): when the leader passes 25, 50 and 75% (`checkpointsReached`), each racer still typing who is last or more than 25 points behind gets one (`pickBonusReceivers`, 3 per race at most), rotating through Shortcut (-3 words at the end of their own text), Burden (+3 words on the leader's text) and Fog (the leader's next words blur for 5 s). Every racer has their own `text`, so progress, WPM and finishing follow the shortened or lengthened text (BONUS-04). Bots take bonuses too: a changed text re-plans the rest of their run (`replanBotRun`, seeded by the race), fog delays their next keys. Recent bonuses travel in the snapshot (`bonusEvents`, 4 s) and the race page announces them (`BonusFeed`).
- Sudden death: an eliminated racer stops typing (server and client), counts as done for the race end, and ranks after every racer still in, the last one knocked out first. Their WPM is measured up to the elimination.
- Chat: any member sends messages (`sendMessage`): whitespace collapsed, 1-140 characters, one message per 500 ms per player, last 50 kept in the lobby (memory only) and sent in every snapshot. Quick taunts are preset messages in the sender's language.
- Start: the server builds the text from the settings (`buildRaceText` in `lib/text-builder.ts`: coherent passages from the `race_texts` corpus, merged with the built-in ones and reloaded every 10 min by `lib/lobby-server.ts`, or random words from `lib/word-lists.ts`; then length, complexity, punctuation, capitals, accents, numbers and letter filters) and sets `startsAt = now + 3 s`. Snapshots carry `serverNow` so every client shows the same countdown.
- Input: the client diffs the hidden input into `char`/`delete` events and posts them in numbered batches (one request at a time, retried with the same number). The server replays them with `lib/typing.ts`, timed by its own clock, and ignores repeated batches, input outside the race and more than 30 keys/s. Progress, WPM, places, finish and results are computed server-side only. Client-measured key delays are used only for the heatmap.
- Progress is broadcast at most every 100 ms per lobby; membership and phase changes are broadcast immediately.
- End: when every racer finished, was eliminated, left, or stayed disconnected past the grace period, or at the time limit. Results are ranked with `rankRacers`.

**Bots:** the host adds bots from the lobby (one button per difficulty, so every bot can have its own level) and removes them while no race is running. A bot is a lobby member with `bot` set to its difficulty: always connected and ready, never host, counted in the capacity. When the race starts, `planBotRun` plans each bot's keystrokes; `advance` replays the ones that are due with the same typing rules as players (progress, samples, key stats, results). Plans are human-like: target speed per difficulty (`botTargetWpm`, ±8% per race), uneven rhythm, slower capitals and punctuation, short pauses between words, and typos on neighboring QWERTY keys that are sometimes noticed a few keys late, then deleted and retyped. Easier levels make more typos and react more slowly. A single player can race bots. The race ends early once no player is left, and bots are removed when the last player leaves.

**Reconnection:** a player whose stream drops keeps their seat and race progress for 30 s (`reconnectGraceMs`). `EventSource` reconnects on its own and a reload restores the typed text from the snapshot (the input stays read-only until the page is hydrated, so keys typed earlier are not silently dropped). Each page load sends input with its own client id: its first batch takes over and late batches from the previous page are ignored; when idle, the client adopts the server's copy of the typed text. Timers run on the server, so the race never depends on the host's browser.

**Single instance only:** all lobby state lives in the memory of one Node process. Deployment configs for Railway (`railway.json`) and Render (`render.yaml`) keep one instance; see the README. Run exactly one app instance (no serverless, no horizontal scaling, no multiple workers behind a load balancer). A restart or deploy ends every lobby. Scaling out later needs shared state (e.g. Redis) behind the same store interface.

**Playing on the local network (dev):** add your LAN IP to `ALLOWED_DEV_ORIGINS` in `.env` (e.g. `ALLOWED_DEV_ORIGINS=10.3.3.55`), restart `next dev`, and share the `Network:` URL. Other devices must be on the same network. Use email/password accounts: OAuth callbacks point to `APP_URL`. `next start` over plain HTTP on an IP does not work for sign-in, because the production session cookie is `Secure`.

In development, editing `race-engine.ts` or `lobby-store.ts` does not update the store already created on `globalThis`: restart `next dev` after such changes.

## Data model

Persistent data only. Lobbies, races, chat and full results live in memory (see Multiplayer and the ADR below).

```mermaid
erDiagram
  users ||--o{ oauth_accounts : "signs in with"
  users ||--o{ sessions : "holds"
  users ||--o{ race_results : "finished"
  users ||--o| user_avatars : "uploaded"

  users {
    uuid id PK
    text kind "guest | registered"
    text username "unique (case-insensitive) among registered"
    text email "unique, nullable"
    text password_hash "scrypt, nullable"
    text avatar_url
    text locale "fr | en"
    text character_id
    timestamptz created_at
    timestamptz updated_at
    timestamptz last_seen_at
  }
  oauth_accounts {
    text provider PK "github | discord | google"
    text provider_account_id PK
    uuid user_id FK
    timestamptz created_at
  }
  sessions {
    text token_hash PK "SHA-256 of the cookie token"
    uuid user_id FK
    timestamptz created_at
    timestamptz expires_at
  }
  user_avatars {
    uuid user_id PK, FK
    text content_type "image/jpeg | image/png | image/webp"
    bytea data "2 MB max"
    timestamptz updated_at
  }
  race_texts {
    uuid id PK
    text language "fr | en"
    text body "unique"
    boolean has_numbers
    timestamptz created_at
  }
  race_results {
    uuid id PK
    uuid user_id FK
    text lobby_code
    timestamptz ended_at
    int place
    int racer_count
    float wpm
    float accuracy "0..1"
    int finish_ms "null if not finished"
    int duration_ms
    int keystrokes
    int mistakes
    timestamptz created_at
  }
```

`race_results` is unique on `(user_id, lobby_code, ended_at)`. Source of truth: `db/migrations/`.

## Race state machine

`LobbyPhase` in `lib/race-engine.ts`. The assignment's names (COURSE-01) map to the code as follows: `EN_ATTENTE` = `waiting`, `DÉCOMPTE` = `countdown`, `EN_COURSE` = `racing`, `RÉSULTATS` = `finished`, `FERMÉE` = the lobby is deleted from the store.

```mermaid
stateDiagram-v2
  [*] --> waiting : host creates the lobby
  waiting --> countdown : host starts (canStartRace: ≥ 2 racers, all ready)
  countdown --> racing : now ≥ startsAt (3 s, advance)
  racing --> finished : everyone finished / eliminated / left / disconnected > 30 s, or time limit
  finished --> waiting : first lobby action (ready, join, start)
  waiting --> closed : last human leaves or their seat expires
  finished --> closed : last human leaves or their seat expires
  racing --> closed : last human leaves (the race ends first)
  closed --> [*]
```

- Every transition is a pure function of `(state, event, now)`; time-based ones (`countdown → racing`, `racing → finished`, seat expiry) happen in `advance`, called by the store's 100 ms timer.
- Joining is refused during `countdown` and `racing` (`raceInProgress`).
- Settings, bots and visibility can only change in `waiting`.

## Real-time message flow

One race, seen from one player. Every other player has the same SSE stream; bots have no connection, the store's timer plays their keystrokes.

```mermaid
sequenceDiagram
  autonumber
  participant B as Browser (lobby / race page)
  participant A as Server Functions<br/>features/lobby/actions.ts
  participant E as GET /api/lobbies/[code]/events (SSE)
  participant I as POST /api/lobbies/[code]/input
  participant S as Lobby store<br/>lib/lobby-store.ts + race-engine.ts
  participant D as PostgreSQL

  B->>A: createLobby / joinLobby (session cookie)
  A->>S: join(code, user)
  B->>E: EventSource opens
  E->>S: subscribe(code, user), mark connected
  S-->>E: snapshot (members, settings, phase, serverNow)
  E-->>B: event: snapshot
  B->>A: setLobbyReady, updateLobbySettings, addLobbyBot…
  A->>S: validated action (the engine refuses host-only ones from others)
  S-->>E: new snapshot, broadcast at once
  E-->>B: event: snapshot
  B->>A: startLobbyRace (host)
  A->>S: start: pick text, startsAt = now + 3 s, plan bot runs
  S-->>B: snapshot with text and startsAt (countdown synced with serverNow)
  loop every 100 ms (store timer)
    S->>S: advance: countdown → racing, bot keystrokes, time limit, expired seats
  end
  loop while racing
    B->>I: batch {clientId, seq, events: char/delete}
    I->>S: input: replay with lib/typing.ts on the server clock
    I-->>B: 204 (or 400 / 403 / 404)
    S-->>E: progress snapshot, at most every 100 ms per lobby
    E-->>B: event: snapshot (positions, WPM, places)
  end
  S->>S: everyone done or time limit: finished, rankRacers
  S-->>E: snapshot with results
  E-->>B: event: snapshot → results page
  S->>D: saveRaceResults (registered players only, once per race)
```

- The client never sends progress, WPM or places: only keystrokes. Batches are numbered, so a retried batch is ignored, and the server drops input outside the race or above 30 keys/s.
- If the stream drops, `EventSource` reconnects and the next snapshot restores the race; the seat is kept for 30 s (see Reconnection).
- The database is written once per race, at the end, never per keystroke (PERF-02).

## ADR-001: Real-time transport

**Status:** accepted.

**Context.** Every player must see the others move on the track several times per second (TECH-06, COURSE-05), the server must stay authoritative (COURSE-06), and the app runs as one Next.js process on a PaaS. Next.js route handlers do not support WebSocket upgrades without a custom server.

**Options considered.**

| Option | For | Against |
| --- | --- | --- |
| WebSocket (custom server or `ws`) | Two-way, low latency | Needs a custom Node server next to Next.js, its own auth, reconnection and heartbeat code |
| Hosted service (Pusher, Ably, Supabase Realtime) | Nothing to host | Free-tier limits (TECH-08), a third party sees every message, game logic split across services |
| MQTT | Pub/sub built in | Needs a broker; overkill for one room per lobby |
| **Server-Sent Events + HTTP POST** | Plain route handlers, works through proxies, `EventSource` reconnects on its own, same cookie auth as the rest of the app | One-way: client → server goes through separate requests |

**Decision.** Server-Sent Events for server → client (`app/api/lobbies/[code]/events`: one full snapshot per change, progress throttled to one broadcast per 100 ms per lobby) and batched HTTP POSTs for client → server keystrokes (`.../input`: numbered batches, one request in flight, retried with the same number). Lobby actions (create, join, ready, start, settings) are Server Functions.

**Consequences.**
- About 10 updates per second reach every client, above the ~4 required; the track interpolates between them.
- Keystrokes are batched, so a player sends a few requests per second instead of one per key (PERF-02). Nothing is written to the database while racing.
- The transport only moves events and snapshots; all rules are in `race-engine.ts`, so switching to WebSockets would only touch the transport layer.
- State lives in one process: the app must run as a single instance (see Multiplayer).

## ADR-002: Bots

**Status:** accepted.

**Context.** Bots must race like humans (variable speed, mistakes and corrections, BOT-02/03), obey the same rules and bonuses as players (BOT-04) and be unit-testable (BOT-05).

**Decision.**
- A bot is a regular lobby member with `bot` set to its difficulty. It goes through the same typing engine (`lib/typing.ts`) as a human: progress, WPM, accuracy, key stats and ranking are computed the same way.
- At race start, `planBotRun(text, difficulty, random)` (`lib/bots.ts`) plans the bot's whole race as a list of timed `char` / `delete` keystrokes. The store's timer replays the steps that are due in `advance`, on the server only.
- The plan varies speed per race (±8 %) and per key (capitals, punctuation, word gaps), injects typos on neighboring keys that are noticed late, deleted and retyped.
- Randomness is injected (`random: () => number`), never read from a global, so tests pass a seeded generator and get the exact same race every time.

**Consequences.**
- Bots cost almost nothing at runtime (no AI, no extra process) and cannot cheat, since they use the player code path.
- Bonuses act on the shared racer state, so they affect bots too.
- Planning the whole race up front means a bonus that changes the text (+3 or -3 words) re-plans the remaining steps (`replanBotRun`, seeded by the race so it stays reproducible); fog only delays the next steps.
