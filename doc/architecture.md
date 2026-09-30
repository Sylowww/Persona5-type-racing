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
  components/
    layout/                 Site-wide chrome (header, footer, wordmark)
    ui/                     Generic, reusable primitives (Icon)
  features/<feature>/
    components/             Components used only by that feature (e.g. features/home)
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
