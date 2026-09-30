# Status

Last updated: 2026-09-30.

## Built

- Bilingual (`/fr`, `/en`) home page with the Persona 5 theme: header, calling-card banner, start-race button (Enter/Space shortcut), mode cards, join-with-code form, typing preview, player dossier (stats, radar, leaderboard, key-audio switch), footer.
- Real-time multiplayer races (see architecture.md, Multiplayer). Signed-in players create a lobby ("Start a race" on home), others join with its `P5-XXXX` code (or its URL), everyone readies up, the host starts, a synchronized 3 s countdown runs, all racers type the same text and see each other move live, and the server ends the race and sends everyone to the real results. Server-authoritative, in memory, single Node instance.
- Lobby page (`/{locale}/lobby/{code}`): live roster with connection status, ready meter, ready/unready, host-only start, leave. Capacity 30 by default (max 60, `LOBBY_CAPACITY`); free seats collapse into one invite card.
- Race page (`/{locale}/lobby/{code}/race`): countdown overlay, timer, live place from the server, race track of every racer (dimmed while disconnected), typing arena, WPM, streak and accuracy. Typing logic lives in `lib/typing.ts` and runs on both client and server.
- Results page (`/{locale}/lobby/{code}/results`): banner, podium, speed chart, precision stats, slow keys and keyboard heatmap from the real race; back-to-lobby and rematch return to the same lobby.
- Bots: the host adds bots of any difficulty (rookie ~60, master ~120, godspeed ~150 WPM), each with its own level, and removes them in the lobby. They race with the same rules as players, with a human-like rhythm and typos they correct (see architecture.md, Bots). One player plus bots is enough to start.
- Reconnection: 30 s grace period for a lost connection in the lobby and during a race; reloading the race page restores progress.

- Race history: when a race ends, the server saves each registered player's place, WPM, accuracy and time in `race_results`. The profile page (`/fr/profile`, `/en/profile`, registered users only: avatar, username, member since, sign-in methods) shows races, record, average WPM, accuracy and the last 10 races; the home dossier shows record, accuracy and race count, and links to the profile. Guests keep their races in `sessionStorage` (the results page writes them), so they last until the tab is closed; the home dossier shows them.

- Database foundation: migration runner, `users` / `oauth_accounts` / `sessions` schema, password hashing, session tokens, account validation and data-access functions (`lib/users.ts`). Used by email/password auth.

- Email/password sign up (`/fr/sign-up`, `/en/sign-up`), sign in (`/…/sign-in`), sign out, session cookie and current-user lookup. The header shows the signed-in username or Sign in / Join links.
- OAuth sign-in with Google, GitHub and Discord (buttons appear once the provider's credentials are in `.env`). Not yet tested against real provider apps.

## Mocked / not wired

- Radar is an empty state until it is computed from saved races. `SkillRadar` is kept for when it is.
- Leaderboard and server data come from `src/mocks/player.ts`; the home page hides the mock "you" row. `mockPlayer` (with radar values) is no longer used by any page.
- Lobby buttons for settings, chat and invite observer do nothing; the rules dossier shows the fixed rules races use today; the taunt feed and spectators are empty. Player cards show `-- WPM` as best speed until stats are stored.
- Nav items other than Home and Lobby, and the mode cards, do nothing yet. "Start a race" opens a new lobby (no matchmaking).
- Sound and key-audio selection are UI only.
- Avatar and logo are placeholders (icon + wordmark) until real assets exist.

- Race texts are a small built-in list per language (`lib/race-texts.ts`); countdown (3 s), time limit (3 min), grace period (30 s) and speed limit (30 keys/s) are fixed defaults in `lib/race-engine.ts`.
- Full results (podium, chart, heatmap) live in memory with the lobby and disappear when it closes or the server restarts; only each player's summary is saved (see Built). Heatmap thresholds (100 ms fast, 250 ms or a miss = slow) are placeholders.
- Error mode is fixed: wrong characters stay and must be deleted; corrected mistakes still count against accuracy.

## Not started

Guest sessions (no page creates a guest yet, so racing requires an account and the guest history above is not reachable yet), heatmap history, spectators, public lobby discovery, matchmaking, race settings, multi-instance deployment (shared lobby state).

## Undecided

- Auth extras: password reset, email verification, rate limiting of sign-in attempts, redirect back to the previous page after sign-in, linking an OAuth identity to an existing email/password account, showing OAuth avatars.

- Light mode design.
- Final behavior of bonuses and catch-up mechanics.
- Bonus/overtake effects from the race mockup (showtime burst, overtake cut-in) are not built.
- Results-page extras from the mockup not built: rank grade (S), EXP points, rating/promotion card, personal best, latency, save/export buttons.
- Lobby code format: `P5-` + 4 characters without 0/O/1/I (about one million codes).
- What a race should do with players who join after it started (currently refused until it ends) and whether leaving mid-race should count as a loss.
- Bot tuning: target speeds, typo rates and names are first guesses; bots always use a QWERTY layout for typos. Bot races currently count in player stats; whether they should is undecided. A guest who signs up does not bring their tab's races into the account.
- Anti-cheat beyond the keystroke rate limit (e.g. paste or bot detection).
