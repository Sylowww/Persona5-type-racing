# Status

Last updated: 2026-09-30.

## Built

- Bilingual (`/fr`, `/en`) home page with the Persona 5 theme: header, calling-card banner, start-race button (Enter/Space shortcut), mode cards, join-with-code form, typing preview, player dossier (stats, radar, leaderboard, key-audio switch), footer.
- Bilingual lobby page (`/fr/lobby`, `/en/lobby`): lobby code with copy button, ready meter, player calling cards, invite and add-bot slots, rules dossier, key-sound picker, spectators, taunt feed, action dock. Header nav links Home, Quick race and Lobby.
- Bilingual live race page (`/fr/race`, `/en/race`): race timer, objective, placement badge, race track lanes, typing arena with per-character feedback, WPM, streak and accuracy. Typing logic lives in `lib/typing.ts`.
- Bilingual race results page (`/fr/race/results`, `/en/race/results`): result banner, podium, speed chart, precision stats, slow keys, keyboard heatmap, back-to-lobby and rematch links. Ranking and heatmap logic lives in `lib/results.ts`.

- Database foundation: migration runner, `users` / `oauth_accounts` / `sessions` schema, password hashing, session tokens, account validation and data-access functions (`lib/users.ts`). Not yet used by any page.

## Mocked / not wired

- All player, leaderboard and server data comes from `src/mocks/player.ts`.
- Lobby data comes from `src/mocks/lobby.ts`; there is one fixed lobby, no `/lobby/[code]` route yet.
- Lobby buttons (add bot, settings, chat, leave, invite observer, start) do nothing; start is disabled until everyone is ready (`canStartRace` in `lib/lobby.ts`).
- Nav items, mode cards, "Start a race" and "Join with code" do nothing yet (no pages, matchmaking or lobbies).
- Sound and key-audio selection are UI only.
- Avatar and logo are placeholders (icon + wordmark) until real assets exist.

- Race data comes from `src/mocks/race.ts`; only the local player moves. Rivals are static and the race starts on the first key (no countdown, no server sync). Finishing a race does not open the results page yet.
- Results data comes from `src/mocks/race-result.ts`. Heatmap thresholds (100 ms fast, 250 ms or a miss = slow) are placeholders.
- Error mode is fixed: wrong characters stay and must be deleted; corrected mistakes still count against accuracy.

## Not started

Real-time race sync, lobbies, sign-in/sign-up pages, session cookies, OAuth flows (GitHub, Discord), bots, stats persistence, heatmaps.

## Undecided

- Light mode design.
- Final behavior of bonuses and catch-up mechanics.
- Bonus/overtake effects from the race mockup (showtime burst, overtake cut-in) are not built.
- Results-page extras from the mockup not built: rank grade (S), EXP points, rating/promotion card, personal best, latency, save/export buttons.
- Lobby code format (placeholder `P5-XXXX`, 7 characters).
