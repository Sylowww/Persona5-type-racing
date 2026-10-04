# Status

Last updated: 2026-10-04.

## Built

- Bilingual (`/fr`, `/en`) home page with the Persona 5 theme: header, calling-card banner, start-race button (Enter/Space shortcut), mode cards, join-with-code form, typing preview, player dossier (stats, skill radar), footer.
- Skill radar on the home dossier (`skillRadar` in `lib/radar.ts`), from the last 20 races (saved races for accounts, the tab's races for guests): top speed (best WPM), average speed, accuracy (80% at the center, 100% at the edge), stamina (share of races finished), placement (average standing) and consistency (WPM spread between races; neutral after one race). Speed axes are full at 150 WPM. "Sync" is the average of the six axes. These scales are first guesses.
- Real-time multiplayer races (see architecture.md, Multiplayer). Signed-in players create a lobby ("Start a race" on home), others join with its `P5-XXXX` code (or its URL), everyone readies up, the host starts, a synchronized 3 s countdown runs, all racers type the same text and see each other move live, and the server ends the race and sends everyone to the real results. Server-authoritative, in memory, single Node instance.
- Lobby page (`/{locale}/lobby/{code}`): player cards show the portrait of each player's character (Oracle still uses an emblem), live roster with connection status, ready meter, ready/unready, host-only start, leave (the action bar sits right under the lobby header). Capacity 30 by default (max 60, `LOBBY_CAPACITY`); free seats collapse into one invite card.
- Race page (`/{locale}/lobby/{code}/race`): countdown overlay, timer, live place from the server, race track where every racer is an animated runner (idle, run, jump over decorative obstacles, victory; dimmed while disconnected), typing arena, WPM, streak and accuracy, all inside a collapsing-palace atmosphere (cracks, debris, rumbles, alarm vignette, total chaos once the leader is halfway, a calling card and a Mona cut-in during the countdown, Mona's live comments, overtake flashes, stumbling runners, a glowing exit, a finish frame and a winner cut-in, final collapse before the results, results reveal, synthesized sound effects; see design-system.md). Typing logic lives in `lib/typing.ts` and runs on both client and server.
- Results page (`/{locale}/lobby/{code}/results`): opening wedges and a Mona cut-in (congratulations, scolding for last place, or "go train"), banner, podium, speed chart, precision stats, slow keys and keyboard heatmap from the real race; back-to-lobby and rematch return to the same lobby.
- Bots: the host adds bots of any difficulty (rookie ~60, master ~120, godspeed ~150 WPM), each with its own level, and removes them in the lobby. They race with the same rules as players, with a human-like rhythm and typos they correct (see architecture.md, Bots). One player plus bots is enough to start.
- Background music (`components/layout/music-player.tsx`, tracks in `public/music/`): the race page plays the race theme from 25 s (vocals start as the 3 s countdown ends), every other page the home theme chosen in the header (Theme I or II). Header buttons pick the theme and mute (the mute also silences sound effects); both choices are saved in `localStorage`. Playback starts on the first click or key press when the browser blocks autoplay.
- Race settings: the host picks the mode (normal or sudden death), powers on/off (no effect yet), time limit (30 s to 3 min, or none), numbers and case sensitivity in the settings panel (opened by "Lobby settings" or the rules summary's Edit button); every player sees the chosen rules live in the rules summary at the top of the right column, above the chat. The race page shows the time left for timed races and eliminates a racer at their first mistake in sudden death.
- Lobby chat: messages and quick taunts, shared live with every member (last 50, in memory with the lobby). The "Lobby settings" and "Chat / taunts" buttons jump to the rules and the chat input.
- Reconnection: 30 s grace period for a lost connection in the lobby and during a race; reloading the race page restores progress.

- Home mode cards: "Quick play // 1v1" opens matchmaking (another player, or a bot after 15 s; 30 s race, saved like any race), then a full-screen versus splash (both characters, names, "VS") before the race and "Training dojo" starts a solo practice race at once (not saved). The red "Start a race" button still creates a custom lobby; the duplicate "Create heist lobby" card was removed.
- Public and private lobbies: a custom lobby is private by default (code or link); its host can make it public from the settings panel. The "Find a lobby" home card opens `/lobbies`, which lists public lobbies (host, language, mode, time limit, players, status), refreshes every 5 s and joins one in a click.
- Header nav: Home and Leaderboards only (races, training and lobbies start from the home page).
- Leaderboard (`/fr/leaderboard`, `/en/leaderboard`): top 100 registered players by record WPM, with average WPM, accuracy and race count; 10 per page with previous/next arrows, each page loaded from the server; the signed-in player's row is highlighted.
- Race history: when a race ends, the server saves each registered player's place, WPM, accuracy and time in `race_results`. The profile page (`/fr/profile`, `/en/profile`, registered users only: avatar, username, member since, character picker (Joker, Mona, Panther, Skull, Fox, Queen, Oracle, Noir, Crow or Violet, used from the next lobby joined), sign-in methods) shows races, record, average WPM, accuracy and the last 10 races; the home dossier shows record, accuracy and race count, and links to the profile. Guests keep their races in `sessionStorage` (the results page writes them), so they last until the tab is closed; the home dossier shows them.

- Database foundation: migration runner, `users` / `oauth_accounts` / `sessions` schema, password hashing, session tokens, account validation and data-access functions (`lib/users.ts`). Used by email/password auth.

- Email/password sign up (`/fr/sign-up`, `/en/sign-up`), sign in (`/…/sign-in`), sign out, session cookie and current-user lookup. The header shows the signed-in username or Sign in / Join links.
- OAuth sign-in with Google, GitHub and Discord (buttons appear once the provider's credentials are in `.env`). Not yet tested against real provider apps.

## Mocked / not wired

- Server data comes from `src/mocks/player.ts`.
- The invite observer button does nothing and the spectator list is empty. Player cards show `-- WPM` as best speed until stats are stored.
- "Start a race" opens a new lobby to invite players into; matchmaking is only for quick 1v1.
- Key-audio selection is UI only (no key sounds yet).
- Avatar and logo are placeholders (icon + wordmark) until real assets exist. Oracle has no lobby portrait yet.

- Race texts are a small built-in list per language, with a separate list with digits (`lib/race-texts.ts`); countdown (3 s), grace period (30 s) and speed limit (30 keys/s) are fixed defaults in `lib/race-engine.ts`. Punctuation is always on.
- Full results (podium, chart, heatmap) live in memory with the lobby and disappear when it closes or the server restarts; only each player's summary is saved (see Built). Heatmap thresholds (100 ms fast, 250 ms or a miss = slow) are placeholders.
- Normal mode: wrong characters stay and must be deleted; corrected mistakes still count against accuracy.

## Not started

Guest sessions (no page creates a guest yet, so racing requires an account and the guest history above is not reachable yet), heatmap history, spectators, matchmaking for custom lobbies, powers (the setting exists but does nothing), multi-instance deployment (shared lobby state).

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
