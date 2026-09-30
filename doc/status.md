# Status

Last updated: 2026-09-30.

## Built

- Bilingual (`/fr`, `/en`) home page with the Persona 5 theme: header, calling-card banner, start-race button (Enter/Space shortcut), mode cards, join-with-code form, typing preview, player dossier (stats, radar, leaderboard, key-audio switch), footer.

## Mocked / not wired

- All player, leaderboard and server data comes from `src/mocks/player.ts`.
- Nav items, mode cards, "Start a race" and "Join with code" do nothing yet (no pages, matchmaking or lobbies).
- Sound and key-audio selection are UI only.
- Avatar and logo are placeholders (icon + wordmark) until real assets exist.

## Not started

Races and real-time sync, lobbies, accounts and OAuth (GitHub, Discord), bots, stats persistence, heatmaps, database schema and migrations.

## Undecided

- Light mode design.
- Final behavior of bonuses and catch-up mechanics.
- Lobby code format (placeholder `P5-XXXX`, 7 characters).
