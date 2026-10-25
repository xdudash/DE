# Visual system — "Linie"

Status: **Accepted**. First version 2026-10-20 (DG-017); revised 2026-10-21 at the owner's request to read as an app, not a document (DG-020). Implemented in `apps/web/app/globals.css`. This records the decisions so later screens stay in one language and nobody has to re-derive them.

## The idea
Learning German for a life in Germany, Austria or Switzerland is drawn as a ride on a transit line. The route is a line with stations, the learner is at one of them, a lesson is one ride, and finishing it is an arrival. That metaphor is the one bold element: the line on the home screen and the arrival screen. Everything around it is quiet, flat and legible.

The first version treated the interface as signage for a sentence (hairlines, rails, one colour per meaning). The revision keeps every rule of that version that protects honesty and readability, and drops the document-like layout: screens are now app screens with one primary action each.

## Colour
| Token | Light | Role |
|---|---|---|
| `--bg` | `#eef2f7` | the app behind the cards |
| `--paper` | `#ffffff` | cards, bars, the lesson screen |
| `--surface` | `#f4f7fb` | wells inside cards (examples, notes, tables) |
| `--ink` / `--ink-2` | `#0f1f33` / `#4a5b72` | text, secondary text |
| `--line` / `--line-2` | `#dbe3ee` / `#b9c6d8` | borders, ledges, the unfinished rail |
| `--action` / `--action-edge` | `#1b4fa0` / `#123a78` | the line colour: filled actions and their ledge |
| `--ok-fill` / `--bad-fill` | `#12804a` / `#c62828` | verdicts, finished stations, the lesson progress bar |
| `--flame` / `--heart` | `#ef7d00` / `#d93636` | streak and hearts icons only |
| **`--slot`** | **`#f3c300`** | **the finite verb in position 2 — nothing else** |

The dark theme redefines every token except `--slot`: the signal colour keeps its meaning in both themes.

**The yellow rule.** `--slot` marks the finite verb and only the finite verb — in the station preview, in the pattern table and in highlighted examples. It is never used for emphasis, warnings, rewards or decoration.

## Type
One superfamily, loaded by `next/font` and served from our own origin:
- **IBM Plex Sans** — interface and explanations, Latin and Cyrillic, weights 600–700 for anything you act on.
- **IBM Plex Serif** — German, applied by `[lang="de"]`, so content marks itself and German reads as specimen text.

Arabic has no dedicated face yet; the preview locale falls back to the system font.

## Things you press stand on a ledge
Buttons, answer options, word tokens and language cards have a 3–4px ledge in a darker shade and press down when tapped. Information (cards, figures, notes) never has a ledge, so the difference between "read this" and "tap this" is visible without words. There are no soft shadows.

## Screens
- **Home — the line.** The route whose written lesson comes soonest (`pickLine` in `lib/path.ts`) is drawn as a line: a platform-style badge with the level, the name, "n of m stations", and the stations. A finished lesson is a green stop with a tick; "you are here" is a large ringed stop with the lesson card (the sentence it teaches and one Start button); topics without a lesson are small grey stops with a lock and "In preparation", never links. The daily goal (answers today against the planned minutes) sits beside the line on wide screens and below it on a phone.
- **Lesson — a guided run.** Full screen: the site navigation steps aside. Top: leave, a green progress bar, hearts. Middle: one card per step — a piece of the explanation or one exercise. Bottom: one action. On an exercise it is "Check" until answered; then the bar turns green or red, says why, marks the right option, and offers "Continue". A wrong answer comes back once at the end (`lib/lesson-session.ts`).
- **Arrival.** The one celebrated moment: a medal, "Lesson complete!", three tiles (XP earned, first-try accuracy, time) and the day streak, then "Next lesson" or "Back to the line", and "Practise again". Motion here only, and none with reduced motion.
- **Practice and Knowledge map.** Lists of topic cards; an empty list is a card that says what will appear and offers the way back to the line.
- **You.** A profile card (level, XP to the next level, streak, hearts), progress, and settings as cards: plan, explanation language, sound effects, reminders, account, app, and the data on this device.

### Global experience update (2026-10-25)
- Home gives one reasoned next action and keeps the transit line visible as the learner's route. Due reviews and practical missions are accessible without replacing the route.
- Practice has two clear jobs: spaced review of weak concepts and short missions based on authored DACH scenarios. Mission answers use the same evaluator, explanation, and progress event as lesson answers.
- The progress view distinguishes local, waiting, synced, offline, and signed-out states. Account import is an explicit action with counts for responses that can and cannot be rechecked.
- Layout references: [Home](./mockups/home.svg), [Practice](./mockups/practice.svg), [Progress](./mockups/progress.svg); full journey: [Global Experience Blueprint](./GLOBAL_EXPERIENCE.md).

## Shell
Phone first. Below 48rem: a slim top bar (brand, streak, XP, hearts) and a bottom tab bar with four sections. From 48rem: a fixed navigation column on the start side (brand, figures, sections, language switch at its foot) and the content in a column; the home screen adds a side column. Safe-area insets on all sides. Logical properties everywhere, so the Arabic preview mirrors without special cases.

## Sound
Short synthesised tones for right, wrong and arrival (`lib/sound.ts`): no audio files, nothing sent anywhere, switchable in the profile, and never the only signal — every result is also text.

## Quality floor
Minimum 44px targets (54px for the lesson action), visible focus rings, WCAG 2.2 AA contrast in both themes, reduced motion respected, and no horizontal scroll down to 320px (grid columns use `minmax(0, 1fr)` so wide tables scroll inside their own box). Enforced by the axe and phone-layout gates in CI ([ADR-0011](../architecture/decisions/ADR-0011-end-to-end-and-accessibility-testing.md)).

## Honest states
Draft, unreviewed, machine-translated, offline and not-saved notices are plain and legible and never dressed up to look like success. Content status is shown in the learner's language, never as a raw status code. Streak, XP and hearts say they are counted in this browser only.
