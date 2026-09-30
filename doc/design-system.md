# Design system

Visual direction: **Persona 5–inspired** "calling card" style. Red / black / white / yellow, tilted comic panels, hard offset shadows, halftone backdrops, loud condensed italic type.

Use only original assets: no Atlus logos, character art or fonts.

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

## Responsive

- The race itself targets desktop; other pages must work on phones without horizontal scroll.
- Page gutter: `px-4 md:px-10`. Header nav appears at `xl` (compact until 1800px); server status and the header "Sign in" text link show from 1800px.

## Open points

- **Light mode** is required but not designed yet; only the dark theme exists (`color-scheme: dark`).
