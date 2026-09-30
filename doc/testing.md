# Testing and checks

| Command | What |
| --- | --- |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` (strict) |
| `npm test` | Vitest unit tests in `tests/unit/` |
| `npm run build` | Production build |
| `npm run test:e2e` | Playwright tests in `tests/e2e/` (run `npx playwright install chromium` once) |

CI (`.github/workflows/checks.yml`) runs all of them on every push and pull request.

## What to test

- **Unit:** every pure logic function (`lib/`, `i18n/format.ts`, future race/WPM/bot logic).
- **E2E:** that pages render in both locales and that interactive components respond. Prefer role/label queries (`getByRole`, `getByLabel`).

## Gotcha

Playwright uses `http://127.0.0.1:3000` and reuses an existing server locally. If a dev server started on `localhost:3000` is already running, Next blocks its dev assets for the `127.0.0.1` origin, the page never hydrates, and interaction tests fail. Stop your dev server before `npm run test:e2e`.
