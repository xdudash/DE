# Visual system

Status: **Accepted** (2026-10-20, DG-017). Implemented in `apps/web/app/globals.css`. This records the decisions so later screens stay in one language and nobody has to re-derive them.

## The idea
The product teaches German sentence structure, so the interface is built like signage for a sentence. Hairlines and rails carry structure; one saturated colour carries one meaning.

## Colour
| Token | Light | Role |
|---|---|---|
| `--paper` | `#ffffff` | reading surface |
| `--surface` | `#f1f5fa` | header, tab bar, slot bed, notes |
| `--ink` / `--ink-2` | `#111e2e` / `#4f6076` | text, secondary text |
| `--line` / `--line-2` | `#d5dde8` / `#b4c1d2` | hairlines, rails |
| `--blue` | `#16407a` | links and the one filled action per screen |
| **`--slot`** | **`#f3c300`** | **the finite verb in position 2 — nothing else** |
| `--ok` / `--bad` | `#15704a` / `#b3261e` | answer verdicts |

The dark theme redefines every token except `--slot`: the signal colour keeps its meaning in both themes.

**The yellow rule.** `--slot` marks the finite verb and only the finite verb — in the start-screen sentence, in the pattern table, and in highlighted examples. It is never used for emphasis, warnings or decoration. If a future screen needs attention-drawing colour, it uses weight, rails or `--blue`.

## Type
One superfamily, two members, loaded by `next/font` and served from our own origin (no font-host request from a learner's browser):
- **IBM Plex Sans** — interface and explanations, Latin + Cyrillic.
- **IBM Plex Serif** — German example sentences, so they read as specimens rather than UI text. Applied by `[lang="de"]`, which means content marks itself.

Arabic has no dedicated face yet; the preview locale falls back to the system Arabic font. Scale: `--step--1` to `--step-4`, body at `--step-0` (17px) with a 36rem measure (~70 characters).

## Structure
- **Route** — a vertical rail with a station per step. A filled station is a lesson you can open; a hollow one is planned. Numbering is legitimate here because a route is a real sequence.
- **Slot line** — the start-screen hero: one sentence from the content bundle, split at its finite verb into position 1, position 2 and the rest. Built from `highlight` indices, so it cannot drift from the content.
- **Lists over cards** — topics, examples and errors are hairline-separated rows. Cards are used only where something is genuinely a separate object (an exercise, a language choice).
- **Common errors** — the wrong form on a red rail above the right form on a green rail. No arrow glyph, which would need translating and reads as template chrome.

## Sections
Four, in the bottom bar on a phone and in the header from 48rem: **Home** (where to start and what is next), **Practice** (what the scheduler says is due), **Knowledge map** (every topic and its prerequisites) and **You** (progress, plan, app status, and the learner's own data).

A **panel** is the unit of the You screen: a heading and one idea, separated by space rather than boxed in a card. Numbers are set large and quiet, with a label that adds information instead of repeating the figure. A progress bar is a bar, not a ring: it is read at a glance and stays honest when it is nearly empty.

## Shell
Phone first. Below 48rem the sections live in a bottom bar within thumb reach; from 48rem they move into the header and the bottom bar disappears. Safe-area insets on all four sides. Logical properties everywhere, so the Arabic preview mirrors without special cases.

## Quality floor
Minimum 44px targets (48px for primary actions), visible focus rings, WCAG 2.2 AA contrast in both themes, reduced motion respected, and no horizontal scroll at phone width. These are enforced by the axe and phone-layout gates in CI ([ADR-0011](../architecture/decisions/ADR-0011-end-to-end-and-accessibility-testing.md)).

## Honest states
Draft, unreviewed, machine-translated, offline and not-saved notices are plain and legible and never dressed up to look like success. Content status is shown in the learner's language, never as a raw status code.
