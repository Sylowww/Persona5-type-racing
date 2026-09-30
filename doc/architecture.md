# Architecture

## Folder layout

```
src/
  app/                      Next.js App Router (routes, layouts, global CSS only)
    globals.css             Tailwind 4 theme tokens (see design-system.md)
    [locale]/layout.tsx     <html>, fonts, icon font, site header/footer, metadata
    [locale]/page.tsx       Home page: composes feature components
    [locale]/lobby/page.tsx Lobby page
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
- No schema or migrations exist yet. Every schema change must come with a migration.
- The server will be authoritative for race state, scores and rankings; UI values in `mocks/` are placeholders only.
