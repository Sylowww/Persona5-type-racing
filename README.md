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

## Third-party content notice

This is a non-commercial school project made for a class at Cégep. It is not affiliated with, endorsed by or sponsored by ATLUS or SEGA.

Persona and Persona 5, their characters, artwork, music, sound effects and voice clips are trademarks and copyrighted works of ATLUS / SEGA. The character portraits (`public/portraits/`), sprite sheets (`public/sprites/`, fan art based on those characters), music (`public/music/`), sound effects (`public/sfx/`) and voice clips (`public/voices/`) are used for educational purposes only and remain the property of their respective owners. They must be replaced with original or licensed assets before any commercial or public release of the game.

All other code in this repository was written for this project.
