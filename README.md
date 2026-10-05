# TYPE//STRIKE

A competitive, real-time typing race for students, inspired by Monkeytype and Kahoot, with a Persona 5 look. Players type the same text and race each other live: positions, speed and accuracy update as they type, and every race ends on a podium with detailed stats.

School project (Cégep, 3rd year, web programming).

## Features

- **Real-time multiplayer races**: lobbies with a 3 s synchronized countdown, live track with animated runners, live places, results page (podium, speed chart, accuracy, keyboard heatmap).
- **Lobbies**: private (join with a `P5-XXXX` code or link) or public (listed in the lobby browser); ready-up, host-only start, chat and quick taunts.
- **Race settings** (host only): normal or sudden death (first mistake eliminates you), time limit (30 s to 3 min, or none), texts with numbers, case sensitivity.
- **Game modes**: quick 1v1 matchmaking (a bot steps in after 15 s), solo training dojo (not saved).
- **Bots** with four levels (about 30, 60, 120 and 150 WPM), human-like rhythm and typos.
- **Accounts**: email/password, plus Google, GitHub and Discord sign-in; 12 playable characters.
- **Stats**: race history, skill radar on the home page, top 100 leaderboard.
- French and English UI.

The server is authoritative: clients only send keystrokes; progress, places, results and saved stats are computed on the server.

## Stack

Next.js (App Router) · React · TypeScript (strict) · Tailwind CSS · PostgreSQL · Vitest · Playwright · GitHub Actions.

Real-time updates use Server-Sent Events from Next.js route handlers (no separate socket server). Lobbies and races live in the memory of the Node process, so the app must run as a **single long-running instance** (`next start`), not on serverless hosting.

## Getting started

Requirements: Node.js 22+ and PostgreSQL (17 is used in CI).

1. Install dependencies: `npm ci`
2. Start a database: `docker compose up -d` (or use any local PostgreSQL).
3. Copy `.env.example` to `.env` and set `DATABASE_URL` (the default matches `docker-compose.yml`). OAuth providers are optional: a sign-in button appears only when its client id and secret are set.
4. Create the tables: `npm run db:migrate`
5. Start the app: `npm run dev`, then open http://localhost:3000 (redirects to `/fr`; English is at `/en`).

To play from other devices on the same network during development, see `ALLOWED_DEV_ORIGINS` in `.env.example`.

## Checks

| Command | What it does |
| --- | --- |
| `npm run lint` | ESLint |
| `npm run typecheck` | Route types, then strict TypeScript |
| `npm test` | Unit tests (Vitest) |
| `npm run build` | Production build |
| `npm run test:e2e` | End-to-end tests (Playwright; run `npx playwright install chromium` once). Needs a migrated database; test accounts are deleted after each run. |

CI runs all of them on every push and pull request.

## Documentation

Detailed docs are in [`doc/`](doc/README.md): architecture and multiplayer design, design system, translations, testing, and the current status of each feature.

## Third-party content notice

This is a non-commercial school project made for a class at Cégep. It is not affiliated with, endorsed by or sponsored by ATLUS or SEGA.

Persona and Persona 5, their characters, artwork, music, sound effects and voice clips are trademarks and copyrighted works of ATLUS / SEGA. The character portraits (`public/portraits/`), sprite sheets (`public/sprites/`, fan art based on those characters), music (`public/music/`), sound effects (`public/sfx/`) and voice clips (`public/voices/`) are used for educational purposes only and remain the property of their respective owners. They must be replaced with original or licensed assets before any commercial or public release of the game.

All other code in this repository was written for this project.
