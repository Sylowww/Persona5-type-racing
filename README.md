# Typing Race

Minimal Next.js foundation for a bilingual competitive typing application.

## Local development

Use Node.js 22 or newer. Run `npm ci`, copy `.env.example` to `.env.local`, and set `DATABASE_URL` to a local PostgreSQL database when database access is needed. The application does not query the database yet.

Run `npm run dev` to start the app. The root URL redirects to French (`/fr`); English is available at `/en`.

## Checks

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npx playwright install chromium` once, then `npm run test:e2e`

No schema or migrations exist yet because no persistent features have been defined.
