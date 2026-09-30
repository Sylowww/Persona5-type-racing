# Status

Last updated: 2026-09-30.

## Built

- Bilingual (`/fr`, `/en`) home page with the Persona 5 theme: header, calling-card banner, start-race button (Enter/Space shortcut), mode cards, join-with-code form, typing preview, player dossier (stats, radar, leaderboard, key-audio switch), footer.
- Bilingual lobby page (`/fr/lobby`, `/en/lobby`): lobby code with copy button, ready meter, player calling cards, invite and add-bot slots, rules dossier, key-sound picker, spectators, taunt feed, action dock. Header nav links Home and Lobby.

## Mocked / not wired

- All player, leaderboard and server data comes from `src/mocks/player.ts`.
- Lobby data comes from `src/mocks/lobby.ts`; there is one fixed lobby, no `/lobby/[code]` route yet.
- Lobby buttons (add bot, settings, chat, leave, invite observer, start) do nothing; start is disabled until everyone is ready (`canStartRace` in `lib/lobby.ts`).
- Nav items, mode cards, "Start a race" and "Join with code" do nothing yet (no pages, matchmaking or lobbies).
- Sound and key-audio selection are UI only.
- Avatar and logo are placeholders (icon + wordmark) until real assets exist.

## Not started

Races and real-time sync, lobbies, accounts and OAuth (GitHub, Discord), bots, stats persistence, heatmaps, database schema and migrations.

## Undecided

- Light mode design.
- Final behavior of bonuses and catch-up mechanics.
- Lobby code format (placeholder `P5-XXXX`, 7 characters).
