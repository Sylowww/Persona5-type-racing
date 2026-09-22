# Project

Competitive typing web app for students. Multiplayer races, live rankings, stats, guests/accounts, bots and configurable typing exercises.

The requirements are still preliminary. Do not treat unconfirmed ideas as final requirements or implement speculative features.

## Stack

* Next.js + React + TypeScript
* Tailwind CSS
* PostgreSQL
* French and English UI
* Unit + E2E tests
* CI on GitHub

Keep TypeScript strict. Avoid `any`.

## Architecture

* Keep game/business logic outside React components.
* Server is authoritative for race state, ranking, score, permissions and persistent stats.
* Never trust client-provided competitive values.
* Keep real-time transport separate from game logic.
* Design race state to survive temporary client/host disconnections.
* Validate untrusted input server-side.
* Use database migrations for every schema change.
* Never hardcode user-facing strings; use i18n.

## Domain

Race lifecycle should use explicit states such as:
`waiting -> countdown -> racing -> finished -> closed`

Typing logic should support:

* WPM and accuracy
* mistakes per character
* configurable error behavior
* keyboard heatmap statistics

Bots should use the same race model as players and support variable WPM/errors.

Keep bonus mechanics modular because their final behavior is not confirmed.

## Security

* Hash passwords.
* Authorization is enforced server-side.
* Secrets stay in environment variables.
* Never commit credentials or expose secrets through `NEXT_PUBLIC_*`.

## Workflow

For each task:

1. Read the relevant requirement/issue.
2. Make the smallest reasonable change.
3. Do not refactor unrelated code.
4. Add/update tests for business logic.
5. Run lint, typecheck and relevant tests.
6. Report assumptions or unresolved requirements.

Never claim tests passed unless they were actually run.

## Git

- Commit frequently with small, focused commits.
- Each commit should contain one logical change.
- Keep commit messages short and in English.
- Use Conventional Commits, primarily:
- `feat:` for new features
- `fix:` for bug fixes
- `chore:` for maintenance/configuration
- Never bundle unrelated changes into one commit.
- You may create local commits when appropriate.
- Never push to any remote. The user handles all pushes manually.

## GitHub

- Use `gh` to inspect issues, pull requests and CI status when useful.
- After the user pushes changes, verify relevant GitHub Actions checks when requested.
- Investigate failing CI logs and fix failures when appropriate.
- Never push, merge, close issues, or modify remote state unless explicitly requested.

## Efficiency

- Keep reasoning and responses concise.
- Read only files relevant to the current task.
- Avoid exploring unrelated parts of the repository.
- Do not repeat information already available in AGENTS.md.
- Prefer targeted searches over reading large files entirely.
- Run only relevant tests during development; run broader checks when necessary.
