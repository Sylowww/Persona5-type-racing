# Testing and checks

| Command | What |
| --- | --- |
| `npm run lint` | ESLint |
| `npm run typecheck` | `next typegen` (route types such as `RouteContext`), then `tsc --noEmit` (strict) |
| `npm test` | Vitest unit tests in `tests/unit/` |
| `npm run build` | Production build |
| `npm run test:e2e` | Playwright tests in `tests/e2e/` (run `npx playwright install chromium` once) |

CI (`.github/workflows/checks.yml`) runs all of them on every push and pull request.

## What to test

- **Multiplayer:** engine rules in `tests/unit/race-engine.test.ts` (pure, fixed timestamps), store behavior (broadcasts, timers, connections) in `tests/unit/lobby-store.test.ts` with an injected clock and `tickMs: null`. `tests/e2e/multiplayer.spec.ts` plays a full race in two browser contexts (sign up, create, join, ready, start, type, reload, results); type with a delay (under 30 keys/s) or the server drops keystrokes.

- **Unit:** every pure logic function (`lib/`, `i18n/format.ts`, future race/WPM/bot logic).
- **E2E:** that pages render in both locales and that interactive components respond. Prefer role/label queries (`getByRole`, `getByLabel`).

## Database

The auth E2E tests need a migrated database: set `DATABASE_URL` in `.env` (see `.env.example`) and run `npm run db:migrate`. CI starts a Postgres service and migrates before the build.

## Gotcha

Playwright uses `http://127.0.0.1:3000` and reuses an existing server locally. A reused dev server also keeps its in-memory lobby store from before your last edit to the engine or store (see architecture.md), so restart it before running the multiplayer tests. If a dev server started on `localhost:3000` is already running, Next blocks its dev assets for the `127.0.0.1` origin, the page never hydrates, and interaction tests fail. Stop your dev server before `npm run test:e2e`.
