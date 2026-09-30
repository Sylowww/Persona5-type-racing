# Architecture

## Folder layout

```
src/
  app/                      Next.js App Router (routes, layouts, global CSS only)
    globals.css             Tailwind 4 theme tokens (see design-system.md)
    [locale]/layout.tsx     <html>, fonts, icon font, site header/footer, metadata
    [locale]/page.tsx       Home page: composes feature components
    [locale]/lobby/page.tsx Lobby page
    [locale]/race/page.tsx  Live race page
    [locale]/race/results/page.tsx  Race results page
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
  mocks/                    Placeholder data until the server provides it
  types/                    Shared domain types
tests/
  unit/                     Vitest, pure logic
  e2e/                      Playwright, rendered pages
```

## Rules for placing code

- **Routes stay thin.** `app/**/page.tsx` loads the dictionary and data, then composes components. No business logic there.
- **Business / game logic lives in `src/lib/`** (or a future `src/features/<feature>/logic/`) as pure, typed, tested functions. Example: `lib/radar.ts` computes the radar polygon; `SkillRadar` only renders it.
- **A component used by one feature** goes in `features/<feature>/components/`. Move it to `components/` only once a second feature needs it.
- **Server Components by default.** Add `"use client"` only for components with state or browser events (`StartRaceButton`, `KeyAudioToggle`). Pass them translated strings as props; they never load dictionaries.
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
- Tables: `users` (guests and registered accounts, `kind` column), `oauth_accounts` (GitHub/Discord identities), `sessions` (only the SHA-256 hash of the cookie token is stored).
- `lib/users.ts` is the server-only data access for accounts and sessions. Pure auth helpers (scrypt password hashing, session tokens, input validation) live in `lib/auth/` and are unit tested.
- The server will be authoritative for race state, scores and rankings; UI values in `mocks/` are placeholders only.

## Authentication

- `features/auth/actions.ts`: `signUp`, `signIn`, `signOut` Server Functions used by the forms (`useActionState`). They return error codes, translated by the UI from `auth.errors`.
- `lib/auth/forms.ts`: pure parsing/validation of the submitted forms (unit tested).
- `lib/auth/session.ts` (server-only): `getCurrentUser()` (cached per request), `startSession()`, `endSession()`. Cookie `session`: HttpOnly, `SameSite=Lax`, `Secure` in production, 30 days. Only the token hash is stored.
- Signing up while holding a guest session upgrades that guest row, keeping its history.
- The locale layout reads the current user for the header, so every page renders dynamically. Pages without a session cookie never query the database.
- OAuth (Google, GitHub, Discord): `app/api/auth/[provider]/route.ts` starts the flow (random `state` + PKCE verifier kept in a 10-minute HttpOnly `oauth` cookie) and `.../callback/route.ts` checks the state, exchanges the code, loads the profile and calls `findOrCreateOAuthUser`. Pure helpers (authorize URL, PKCE, profile parsing, username cleanup) are in `lib/auth/oauth.ts`; network calls in `lib/auth/oauth-client.ts`. A provider's button only shows when its `*_CLIENT_ID` and `*_CLIENT_SECRET` are set (see `.env.example`). Callback URL to register with each provider: `{APP_URL}/api/auth/{provider}/callback`.
- To protect a page or action, call `getCurrentUser()` on the server and check `kind`. Never trust client-sent user ids.
