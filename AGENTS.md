# AGENTS.md — Sea of Thieves Asia

Instructions for AI coding agents working in this repository.

## Project purpose
This repository builds the community site for **Sea of Thieves Asia**. It is in
**beta**: the system is being built, but the community's real content does not
exist yet. Do not fabricate it.

## Golden rule
Build the system, not a pretend community. Never invent events, members,
statistics, testimonials, sponsors, partnerships, or "real-looking" links.
See `docs/content.md` for the full placeholder contract.

## Content rules
- All external links and community details are placeholders until launch.
- Every placeholder value MUST be exactly `REPLACE_BEFORE_LAUNCH`.
- Unavailable community links display the literal text "Coming soon".
- Lists that have no beta data (events, gallery, guides, announcements,
  crew listings) are marked `EMPTY_FOR_BETA` and render an empty state,
  never sample/fake entries.
- Do not turn placeholder links into clickable real-looking URLs.

## Working rules
- Follow existing coding conventions and architecture patterns.
- Reuse the project's tooling for common tasks; do not add dependencies
  without need.
- Keep brand decisions in `docs/brand.md` and asset decisions in
  `docs/assets.md`.
- When in doubt, consult the docs before writing code.

## Definition of done
- No invented community content anywhere in the codebase.
- Placeholders are clearly marked and behave as the content contract says.
- The site builds and runs with empty community data.
