# Design system

Visual direction: **Persona 5–inspired** "calling card" style. Red / black / white / yellow, loud condensed italic type. Pages stay flat and calm (black surfaces, thin borders, one red diagonal slash per page) so the race track, the cut-ins and the main call to action carry the drama, like the official Persona 5 sites.

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
| `secondary-fixed` / `secondary-container` `#fde400` | Yellow accents, ready state, shortcut keys |
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

### Contrast and focus (WCAG AA)

- Small text (under 18.66px bold) in signature red on dark surfaces fails AA: use `text-primary` (pink-red) or `text-error` for errors. `text-primary-container` is fine for large display text.
- On a red background, text is `text-on-primary-container` (near white). Dark red (`on-primary-fixed`) and yellow (`secondary-fixed`) are too faint there at small sizes.
- Keyboard focus shows a 3px yellow ring (`:focus-visible` in `globals.css`). Do not remove it with `outline-none` unless the control gets another visible focus style.
- `tests/e2e/accessibility.spec.ts` runs axe on the main pages and fails on any WCAG 2.1 AA violation.

## Recurring patterns

Shared utilities live in `globals.css`; prefer them over one-off classes.

| Utility | Use |
| --- | --- |
| `panel` | Default container: `surface-container-low` with a 1px `surface-container-high` border. No shadow, no rotation. |
| `eyebrow` | Small uppercase HUD label with a short red skewed bar in front. Section titles (`h2`) inside panels. |
| `btn-primary` | Red action button; turns yellow on hover, grey when disabled. One per section. |
| `btn-ghost` | Secondary action: thin border, yellow text, red border on hover. |
| `phantom-slash` | The page backdrop: one red diagonal slash in the top-right corner. Render it with `PageBackdrop` (`components/layout/page-backdrop.tsx`). |
| `halftone` | Comic halftone dots over a colored band. Signature stages only (character file). |
| `ink-distress` | Masks text with sparse noise holes, like worn poster ink. Home hero slogan only. |

- **Page heading:** `PageHeading` (`components/ui/page-heading.tsx`): eyebrow, display `h1`, short red underline bar, optional intro.
- **Lists and tables:** rows inside one `panel`, separated with `divide-y divide-surface-container-high`, not separate cards.
- **Results sections:** `SectionTag` is a header line with a bottom border, not a tilted tape.
- **Headlines:** `font-display uppercase italic tracking-wider`.
- **Hard shadows and tilts are reserved** for signature elements: the race track, the home calling card, main menu, thief showcase and slogan bands, the lobby "Start the race" and results "Rematch" buttons, the results banner, the profile roster, the character file, the home hero and the full-screen cut-ins. Everything else is flat. Keep rotations small (±0.5° to ±6°).

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
- **Sprite sheets** live in `public/sprites/`, described in `lib/characters.ts`: 128×128 px frames with no gap, one row per animation (idle, run, jump, victory), facing right, feet at y = 120, head at the same x in every frame, transparent background. Shown at 64 px. Characters: Joker, Mona, Panther, Skull, Fox, Queen, Oracle, Noir, Crow, Violet (Kasumi Yoshizawa), Black Mask (Goro Akechi, id `blackMask`) and Sophia (Persona 5 Strikers). Violet's sheet was cut from a single generated image with a painted checkerboard, so a few edge pixels may remain; Black Mask's came with real transparency. Players choose theirs on the profile page (Joker by default); bots get a random one. Adding a character = a sheet in `public/sprites/`, an entry in `lib/characters.ts`, a name in `profile.character.names` and the id in `types/character.ts`.
- **Character portraits** (`public/portraits/characters/`, `characterPortrait` in `lib/characters.ts`): 320 px square fan-art busts with the original red background replaced by black. They fill each lobby player card (top-aligned, dark fades top and bottom for the text). Every character has one. Oracle's comes from a busier source (white and black shards kept as decoration). The results podium shows the all-out attack versions (`characterAllOutPortrait`, red background): large for the winner, small for the others; each result carries the racer's `character`.
- The local player gets a yellow glow and the `YOU` badge; others get a thin light outline so the dark sprite stays visible on the lane.
- With reduced motion, runners show the first frame of their animation and move without transitions.
- `components/ui/sprite-frames.tsx` plays one animation of a sheet at any size; the race runner and the profile roster both use it.
- **Home hero** (`features/home/components/home-hero.tsx`): a full-screen red poster above the home page, modeled on the Persona 5 the Animation key visual. On the left, the thieves' all-out portraits behind glass shattered by one shot (12 shards fanning out from a black bullet hole, white crack lines and a broken ring drawn in SVG); on the right, the slogan in black worn ink, a small italic word before each big one. While the player scrolls, the poster stays still and its bottom edge rises like a scroll being rolled up: a shaded red cylinder rides that edge and thickens as more is wound, and the home page follows right below it (it is not an overlay, so nothing is hidden or blocked). Driven by two CSS variables set on scroll (`--hero-scroll`, `--hero-roll`); with reduced motion it simply scrolls away. It only appears when the site opens on the home page (first load, reload, new tab); coming back to the home page from another page skips it and starts on the options.
- **Home page** (`features/home/components/`), after the hero:
  - **Calling card title** (`calling-card-banner.tsx`): "Take their words!" in ransom-note letters, each cut from a different "magazine" (fixed cycles of colors, fonts, sizes and tilts, so the render is stable). Decorative; the page `h1` carries the text.
  - **Main menu** (`home-menu.tsx`): the four actions as a Persona 5 title menu, each entry a huge italic word at its own angle and indent. The selected entry (hover or focus, Start by default) gets a jagged red shard with a white edge behind it and slides right; a dialogue-style "Briefing" box under the menu shows its description (screen readers get it per entry with `aria-describedby`). Enter or Space outside a control starts a race.
  - **Thief showcase** (`phantom-showcase.tsx`): the player's character (guests and visitors: Joker) as an all-out portrait in a tilted white frame on a red halftone starburst, with the idle sprite, a codename plate, the Persona and a "Change thief" tag; links to the character file.
  - **Slogan bands** (`phantom-marquee.tsx`): a red and a black band crossing at ±3°, sliding in opposite directions (`.marquee-strip`, 32 s loop, still with reduced motion). Decorative.
  - **Bottom cards** share one look: a black card with a white border, a red offset shadow and a skewed tab overlapping the top edge. **Join with code** (`join-code-card.tsx`, also on lobby links) is tilted -1° with a red tab, a yellow-bordered code slot and a skewed red "Punch in". The **typing preview** is a dialogue box tilted +1° with a white tab. The **player dossier** has a yellow tape label, a red `halftone` corner, the avatar in a tilted white frame, stats on plates at alternating angles (`stat-tile.tsx`) and the radar on a skewed red halftone backdrop.
- **Character file** (`features/characters/components/character-file.tsx`, `/characters/[id]`): modeled on the Persona 5 Royal character screens. A red comic stage (diagonal `halftone` bands and a yellow line), a tilted "Phantom Thieves" title, the codename on a black plate with a yellow border and the real name on a yellow tape, a "Profile" tab over the bio box (yellow offset shadow), the Persona on a plate, the all-out portrait in a tilted white frame with the idle sprite in front, yellow previous/next arrows and a roster of portrait links below. Signed-in players can choose the thief there (same `chooseCharacter` action as the profile).
- **Profile roster** (`features/profile/components/character-picker.tsx`): a large animated showcase of the chosen character on a red panel with dark diagonal stripes, next to a 3-column grid of tilted cards. Cards play their idle animation on hover or focus; the chosen one is red with a yellow name tag.

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

## Persona spells (race)

Catch-up spells (`lib/spells.ts`) show three ways, all in the spell's element color (`--color-spell-*` tokens in `globals.css`, icon and classes in `features/race/spell-style.ts`):

- **Cut-in** (`features/race/components/spell-cut-in.tsx`): for the caster and the target only, about 1.3 s on the shared cut-in band (`SPELL_CUT_IN_TIMELINE`): the caster's all-out portrait framed in the element color with its icon, the tag `Name // Persona` (their character's Persona casts whatever spell they drew) and the skill shouted in the bubble (« AGI! »). One at a time, each once.
- **Track feed** (`bonus-feed.tsx`): a chip per spell for everyone for 4 s, and a louder banner for the player it acts on.
- **Effects on the target**: hexes restyle the words after the cursor (`.spell-hex-fire` hides them behind flickering flames, `-psy` blurs and wobbles, `-curse` darkens), and Kouga's `.spell-flash-bless` whites out the whole typing area; stuns cover the typing area (`.spell-stun-elec` zaps it, `.spell-stun-ice` frosts it) with « Keys locked ». Reduced motion: colors and blur only, no flicker or wobble. Spells never shake the page, and their announcements sit in a fixed-height slot above the track, so the layout does not move.
- **Marked lane**: the racer a malus hits gets `RaceRacer.mark` for as long as it lasts (2.5 s for extra words); their lane takes the element for everyone (`.lane-mark-ice` frost and snowflakes, `-elec` zaps, `-fire` rising flames, `-psy` pink haze, `-bless` glare, `-curse` purple shade, `-nuclear` glow, `-phys` slash marks), with the element's icon floating over it and next to the name, and the runner tinted (`.lane-runner-*`, frozen blue under ice). In its last 500 ms it fades out, the lane "thaws".

## Race immersion

Presentation-only layers on the race page; the server still decides places, finish and results. Moment detection is pure and tested in `lib/race-moments.ts`; highlight hooks are in `features/race/use-race-highlights.ts`.

- **Lane order**: the player's lane stays on top, then the others by place; when the order changes, lanes slide to their new place (`use-lane-motion.ts`, a FLIP animation with the Web Animations API) and a racer entering the top three flashes yellow (`.lane-rise`). Reduced motion: lanes swap without sliding or flashing.
- **Calling card**: at the start of the countdown, a red calling card ("Take their words!") flips in for 600 ms before Mona's cut-in (`countdownIntro` in `lib/cut-in.ts` skips the card, then Mona, when too little countdown time is left).
- **Mona's comments** (`mona-comms.tsx`): a small corner box with her portrait, a bubble and a recorded line when the player passes someone ("Nice one, keep it up!"), gets passed ("Hey, come on! Wake up!"), keeps a 90-key streak ("Nice going!"), makes 3 mistakes within 2 s ("Ugh... that's not good!"), enters the last 10 % ("One more! This is it!"), when the chaos starts ("Don't panic! Stay cool and blaze through them!") and on finishing ("Well done!"). The most important moment wins, with a 3.5 s gap between comments (finish and chaos may interrupt). Texts: `race.comms`.
- **Overtake flash**: the lane of a racer who just passed the player flashes red.
- **Stumble**: a runner tilts for 350 ms after each mistake (the race view carries each racer's `mistakes`).
- **Exit light**: a yellow light at the end of every lane, brighter (then pulsing) as the leader nears the finish (`exitGlow`).
- **Chaos extras**: stones fall and bounce on the lanes, a red alarm light sweeps the room and the palace alarm sounds once.
- **Finish frame** (`finish-cut-in.tsx`): an "All-Out Attack" style frame (red slash, the player's all-out attack portrait with its original red background in a tilted white frame, "Escaped!") for 1.5 s when the player finishes; if that ends the race, the collapse wedges close over it.
- **Winner cut-in** (`winner-cut-in.tsx`): the other racers see the first finisher's "all-out attack" portrait with its original red background (`characterAllOutPortrait`, files in `public/portraits/characters/all-out/`, same crops as the black lobby versions) in a tilted white frame, in a band ("{name} reached the exit first!").
- **Recorded sounds** in `public/sfx/` (from the game's sound files, played with `playSoundFile`): `calling-card.mp3`, `alarm.mp3`, `all-out-attack.mp3`, `winner.mp3`. They were picked by category and shape, not by ear; swap a file to change a sound.
- **Typing feats** (`lib/race-feats.ts`, `feat-popups.tsx`): Persona-style "damage numbers" float above the character that earned them for 900 ms: « MISS » on a wrong key, « TECHNICAL! » when a mistake is fixed within 1.5 s, « CRITICAL » on a perfect word of 4+ letters typed at least 1.4× the racer's average speed. Every 5 perfect words in a row, « 1 MORE! » bursts over the typing area with the count. Each plays a short synthesized sound (`playFeat`). Presentation only.
- **Current word in cut-out letters**: the letters still to type in the current word become cut-out tiles with a slight tilt: outlined dark tiles (`.ransom-pending`) and a white tile on the next letter (`.ransom-next`); typed letters stay plain and red stays for mistakes. Only colors and `rotate` change, never font, size or padding, so the line never reflows. The cut-out titles elsewhere use `RansomText` (`components/ui/ransom-text.tsx`).
- **HOLD UP!** (`hold-up-cut-in.tsx`, `useHoldUp`): when the player passes a racer, a tilted black band high on the screen shows « HOLD UP! » in cut-out letters and the passed racer's portrait, for 1.2 s, at most once every 4.2 s.
- **Ambush and calling cards** (`race-announcement.tsx`, `calling-card-attack.tsx`): announced in the powers slot above the track for 3 s. The sender and the target of a calling card see the red card flip in; the target's next words are blacked out (`.card-redacted`) with the card pinned on the corner of the typing area. The last racer gets a pulsing « Send calling card » button in the arena header.
- **Third Eye**: a toggle in the arena header (off by default, disabled without a record) turns the track cold blue (`.third-eye-track`) and runs a glowing ghost of the player's character in their lane at their record WPM (`ghostProgress`; the saved record for accounts, the tab's best race for guests), with the gap in characters next to the toggle.
- **Velvet Room**: training race and results pages add the `velvet-room` class, which only swaps the color tokens for velvet blue and gold, plus blue drapes and gold chains (`VelvetRoomDecor`) and one line from Lavenza (before) or Igor (after) (`VelvetRoomLine`).
- **Confidant tarot card** (`TarotCard`): gold-framed card with the arcana numeral, the thief's all-out portrait, the arcana name and one gold diamond per rank. On the results it flips in (`.rank-up-card`, `tarot-flip`) after Mona's verdict, next to "RANK UP!" in cut-out letters; reduced motion shows it at once.
- Reduced motion: no falling stones or sweeping light; overlays appear without sliding.

## Responsive

- The race itself targets desktop; other pages must work on phones without horizontal scroll.
- Page gutter: `px-4 md:px-10`. The header is 64px tall (`h-16`, pages use `pt-16`): wordmark and text nav on the left (nav from `lg`, active link underlined with a red skewed bar), language, music and account on the right. Signed out, the "Sign in" text link shows from `sm` (hidden at `xl` until 1800px to make room); server status shows from 1800px.

## Open points

- **Light mode** is required but not designed yet; only the dark theme exists (`color-scheme: dark`).
