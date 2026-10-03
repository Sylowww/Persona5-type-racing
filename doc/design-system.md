# Design system

Visual direction: **Persona 5–inspired** "calling card" style. Red / black / white / yellow, tilted comic panels, hard offset shadows, halftone backdrops, loud condensed italic type.

Use only original assets: no Atlus logos, character art or fonts. Exception: the runner sprite sheets in `public/sprites/` are Persona fan art used for the class prototype; replace them with original or licensed art before any public release.

## Tokens (`src/app/globals.css`)

Always use tokens; never hardcode hex colors in components (SVG included: use `fill-*` / `stroke-*` classes).

### Colors

| Token | Use |
| --- | --- |
| `surface-container-lowest` `#0e0e10` | Page background, "ink" panels, default shadow color |
| `surface-container-low` / `surface-container` / `-high` / `-highest` | Cards and rows, from darkest to lightest |
| `on-surface`, `on-surface-variant` | Body text, muted text |
| `primary-container` `#e60026` | Signature red: CTAs, highlights, active states |
| `on-primary-container`, `on-primary-fixed` | Text on red (light / dark) |
| `primary`, `primary-fixed`, `tertiary*` | Pink-red accents |
| `secondary` `#ffffff` | Headline white, paper cutouts |
| `secondary-fixed` / `secondary-container` `#fde400` | Yellow accents, tape, shortcut keys |
| `on-secondary-fixed` | Text on yellow |

### Fonts (`next/font`, set in the locale layout)

| Class | Font | Use |
| --- | --- | --- |
| `font-display` | Anton | Big headlines, numbers, wordmark |
| `font-hud` | Chivo 700/900 | Labels, badges, nav, HUD text (usually `uppercase font-black`) |
| `font-body` | Space Grotesk | Body text (default on `<body>`) and the typing text |

### Text sizes

`text-label-hud` (13px), `text-body-md` (15px), `text-headline-sm` (22px), `text-headline-md` (32px), `text-headline-lg` (48px), `text-typing-stream` (28px). Use `text-headline-md md:text-headline-lg` for hero text so it fits phones.

### Hard shadows

`shadow-hard-xs|sm|md|lg|xl` = 2/3/4/5/6px offset, no blur, black by default. Tint with a shadow color: `shadow-hard-md shadow-secondary-fixed`.

## Recurring patterns

- **Tilted panel with ink backing:** an `absolute -inset-1 translate-x-2 translate-y-2 rotate-[x] bg-surface-container-lowest` layer behind a `relative rotate-[-x]` panel with a hard shadow.
- **Badges / tape:** `font-hud text-label-hud font-black uppercase`, small rotation, `shadow-hard-xs`.
- **Headlines:** `font-display uppercase italic tracking-wider`.
- Keep rotations small (±0.5° to ±6°).

## Icons

`<Icon name="bolt" size={38} filled />` from `components/ui/icon.tsx` (Material Symbols Outlined). Only names listed in `iconNames` are loaded; add a name there before using it. Pass `size` as a prop: Tailwind `text-[..]` does not work on icons (the icon stylesheet overrides it).

## Accessibility and motion

- Animations use `motion-safe:` so they stop for users who ask for reduced motion.
- Decorative graphics are `aria-hidden`; icons are always decorative (label the control).
- The text players type must stay calm and readable: no rotation or decoration on the typing text itself during a race.

## Race runners

Each racer on the race track is an animated character running along their lane (`features/race/components/race-runner.tsx`).

- **Position comes only from `progress`** (0 = start, 1 = finish line). The animation never changes progress, WPM or results.
- **Animation** is picked by `lib/race-runner.ts` from how progress changes over the race clock: `idle` (no progress for 800 ms, countdown, after a reload), `run` (cycle speed follows WPM, 0.8× to 1.4×), `jump` (when progress crosses a decorative obstacle at 25 %, 50 % or 75 %, never while near one), `victory` (finished).
- **Sprite sheets** live in `public/sprites/`, described in `lib/characters.ts`: 128×128 px frames with no gap, one row per animation (idle, run, jump, victory), facing right, feet at y = 120, head at the same x in every frame, transparent background. Shown at 64 px. Characters: Joker, Mona, Panther, Skull, Fox, Queen, Oracle, Noir and Crow. Players choose theirs on the profile page (Joker by default); bots get a random one. Adding a character = a sheet in `public/sprites/`, an entry in `lib/characters.ts`, a name in `profile.character.names` and the id in `types/character.ts`.
- The local player gets a yellow glow and the `YOU` badge; others get a thin light outline so the dark sprite stays visible on the lane.
- With reduced motion, runners show the first frame of their animation and move without transitions.
- `components/ui/sprite-frames.tsx` plays one animation of a sheet at any size; the race runner and the profile roster both use it.
- **Profile roster** (`features/profile/components/character-picker.tsx`): a large animated showcase of the chosen character on a tilted red panel, next to a 3×3 grid of tilted cards. Cards play their idle animation on hover or focus; the chosen one is red with a yellow name tag.

## Palace collapse (race page)

The race page feels like escaping a collapsing palace (`features/race/components/palace-collapse.tsx`, pure logic in `lib/palace-collapse.ts`). It is decorative only and never changes the race.

- **Intensity follows time only**: 0 → 0.3 over the 3 s countdown (with a rumble on 3, 2, 1 and a stronger one at the start), then up to 1 at the time limit (square-root curve so short races still escalate).
- **Total chaos** once the leading racer reaches half of the text (`CHAOS_PROGRESS`): a long, heavy rumble with rubble pouring from the ceiling, then 2.5× more debris, strong rumbles (6 to 8 px) every second or so, cracks fully open and a fast, full-strength alarm. It lasts until the final collapse; a reload past the middle resumes the chaos without replaying the onset.
- **Behind the panels** (canvas at `-z-10`): red-lit cracks opening from the top edge with dust pouring from their tips, falling dust and stone chunks, and bursts of rubble on each rumble.
- **In front** (canvas at `z-40`): light grit and a few small stones, plus a pulsing red alarm vignette at the screen edges. No large shapes cross the typing text during the race.
- **Rumbles**: short, uneven shakes of the race content (1 to 5 px), more frequent as intensity rises.
- **Final collapse**: once the server ends the race (everyone finished or time ran out), debris and shards pour down for `FINAL_COLLAPSE_MS` (2.2 s), black diagonal wedges slam shut with a red seam, then the page opens the results.
- **Results reveal** (`features/results/components/collapse-reveal.tsx`): the results page starts with the same wedges closed, then splits them apart (pure CSS, so there is no flash before hydration). It plays on every load of the results page.
- **Sound effects** (`lib/sound-effects.ts`): synthesized with the Web Audio API, no audio files. A deep rumble with falling stones on each rumble (louder as intensity rises), a crash and a slam for the final collapse, a whoosh for the results reveal. The header's mute button silences music and effects together.
- **Reduced motion**: no shake, no falling debris; cracks and the vignette stay static and the wedges fade in.

## Mona cut-ins (race and results)

During the 3 s countdown, Mona slides in on a tilted black band (`features/race/components/countdown-cut-in.tsx`; the band and its clock are shared in `components/ui/cut-in.tsx`, timelines in `lib/cut-in.ts`): her victory pose on a red panel, a yellow name tag and a white jagged speech bubble where her line is typed out while her recorded voice says it. She then switches to her run animation and dashes off as the band leaves, about 2.3 s after it appeared, before the start.

- **Voice lines** are real clips of Mona from the game, in `public/voices/mona/`, played by `playVoiceLine` (`lib/sound-effects.ts`), which lowers the music while she speaks; the mute button silences them too. The bubble shows the same words (`race.cutIn.line`, `results.cutIn.*`; the French text is a translation). Countdown: "Okay, let's go!" (`lets-go.mp3`). Results: "That was amazing." (`amazing.mp3`), "Not bad, not great, but not bad." (`not-bad.mp3`, last place), "Let's go to bed." (`go-to-bed.mp3`, did not finish). A cut-in without a voice clip falls back to synthesized blips.
- Skipped when the countdown has less time left than the cut-in needs (e.g. a reload late in the countdown).
- It sits outside the shaking palace wrapper and never covers the countdown number. Reduced motion: it fades in and out without sliding or running.
- **Results** (`features/results/components/results-cut-in.tsx`): once the collapse wedges open, the band returns lower on the screen with a large Mona portrait rising above it, for about 4.5 s. The verdict comes from `resultsVerdict` (`lib/cut-in.ts`): a player who finished gets the proud portrait and the "escaped" line; one who finished but last of several racers gets the shocked portrait and the "last" line; one who did not finish before the time limit gets the worried portrait and the "training" line. Lines are in `results.cutIn`.
- Portraits live in `public/portraits/` (transparent WebP, 440 px tall, cropped from the game's bust art).

## Race immersion

Presentation-only layers on the race page; the server still decides places, finish and results. Moment detection is pure and tested in `lib/race-moments.ts`; highlight hooks are in `features/race/use-race-highlights.ts`.

- **Calling card**: at the start of the countdown, a red calling card ("Take their words!") flips in for 600 ms before Mona's cut-in (`countdownIntro` in `lib/cut-in.ts` skips the card, then Mona, when too little countdown time is left).
- **Mona's comments** (`mona-comms.tsx`): a small corner box with her portrait, a bubble and a recorded line when the player passes someone ("Nice one, keep it up!"), gets passed ("Hey, come on! Wake up!"), keeps a 90-key streak ("Nice going!"), makes 3 mistakes within 2 s ("Ugh... that's not good!"), enters the last 10 % ("One more! This is it!"), when the chaos starts ("Don't panic! Stay cool and blaze through them!") and on finishing ("Well done!"). The most important moment wins, with a 3.5 s gap between comments (finish and chaos may interrupt). Texts: `race.comms`.
- **Overtake flash**: the lane of a racer who just passed the player flashes red.
- **Stumble**: a runner tilts for 350 ms after each mistake (the race view carries each racer's `mistakes`).
- **Exit light**: a yellow light at the end of every lane, brighter (then pulsing) as the leader nears the finish (`exitGlow`).
- **Chaos extras**: stones fall and bounce on the lanes, a red alarm light sweeps the room and the palace alarm sounds once.
- **Finish frame** (`finish-cut-in.tsx`): an "All-Out Attack" style frame (red slash, the player's character in their victory pose with a dark outline, "Escaped!") for 1.5 s when the player finishes; if that ends the race, the collapse wedges close over it.
- **Winner cut-in** (`winner-cut-in.tsx`): the other racers see the first finisher's character in a band ("{name} reached the exit first!").
- **Recorded sounds** in `public/sfx/` (from the game's sound files, played with `playSoundFile`): `calling-card.mp3`, `alarm.mp3`, `all-out-attack.mp3`, `winner.mp3`. They were picked by category and shape, not by ear; swap a file to change a sound.
- Reduced motion: no falling stones or sweeping light; overlays appear without sliding.

## Responsive

- The race itself targets desktop; other pages must work on phones without horizontal scroll.
- Page gutter: `px-4 md:px-10`. Header nav appears at `xl` (compact until 1800px); server status and the header "Sign in" text link show from 1800px.

## Open points

- **Light mode** is required but not designed yet; only the dark theme exists (`color-scheme: dark`).
