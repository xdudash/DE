# Changelog

User-visible changes of the production deployment (`main`, [operations](../quality/OPERATIONS.md#release-process)) and their known limitations, newest first. One entry per merged pull request that a learner can notice; internal changes are listed only when they change what is promised. Status words follow [project management](./PROJECT_MANAGEMENT.md#5-honesty-rules-for-status): nothing here claims a feature that does not work end to end.

Entry format: `YYYY-MM-DD · #PR · what a learner notices` and, where it applies, `Limits:` with what is still missing.

## Unreleased (open pull requests, not on production)
- #48 DG-011 · No learner-visible change: installs and builds are reproducible (pinned Node, committed lockfile).
- #49 DG-021 · Practice that falls due counts as review: schedules move from 1 day to 3, 7, 16 and 35 days, and concepts can become "provisionally mastered". Limits: counted from this browser's answers until the account is read back (DG-024).
- #50 DG-026 · Sign-in, once configured, verifies sessions with the project's signing keys. Limits: sign-in is still switched off on production (owner setup, privacy gate).
- DG-022 · An answer that could not reach the account is retried by this browser instead of being dropped; the lesson says so. Limits: answers given while signed out are not uploaded later.

## 2026-10-21
- #46 DG-020 · XP, levels, day streak and hearts, counted from answers in this browser; hearts pause checking at zero and come back over time, explanations stay open. Daily reminder code (off until the owner sets up push). App shell "Linie" with stations and a guided lesson run. Limits: the numbers differ between devices; reminders are not configured.
- #46 DG-015 · Sign-in with Google or Apple and account deletion (code merged with #46). Limits: not configured on production; sessions last about an hour.

## 2026-10-20
- #43 DG-019 · Phone lessons: 44 px tap targets everywhere, German compounds hyphenate on narrow screens, layout works at 320 px.
- #41 DG-016/017/018 · Installable app (PWA) that keeps opened pages readable offline; visual system (IBM Plex, route rail, status labels, light and dark); learner area with progress, plan and "delete my data"; practice list from the review scheduler.
- #33–#37 · Start screen with an introduction and a first-visit plan on this device; lesson result and the next lesson; app shell with the engine's next step and the knowledge map.

## 2026-10-19
- #28 DG-015a · 16+ confirmation recorded before an account can be created.
- #26 DG-013 · No learner-visible change: journeys and accessibility are checked automatically on desktop and phone.

## 2026-10-14
- #9 · First lesson (V2 word order, **not yet human-reviewed**) with interactive exercises, rendered from the content bundle.
- #20 DG-012 · The A1 concept graph is mapped: 67 concepts, 66 of them shown as "planned".
- #21 DG-014 · Interface in English, Ukrainian and Russian (uk/ru are machine drafts) and an Arabic right-to-left preview.
- #18, #19, #22 · No learner-visible change yet: learning engine, learner-data schema and attempt recording behind the scenes.
