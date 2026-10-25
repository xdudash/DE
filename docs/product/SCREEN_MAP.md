# Screens and action paths

Current routes are prefixed with one of `en`, `uk`, `ru`, or `ar`. Static screens render from the compiled course bundle or authored content; learner state is read through the shared account/device progress provider unless the row says device-only.

| Screen | Route | Entry points | Main actions and logic |
|---|---|---|---|
| Home / learner line | `/{lang}` | Home tab, logo | Resume the last incomplete lesson from its device-local checkpoint; open next-step recommendation, route lesson, DACH mission, daily goal, or install prompt. Recommendation uses merged evidence and explains its reason. |
| Study-plan setup | `/{lang}/start` | Daily-goal plan link | Three steps: choose goal and daily time, choose a route, confirm and save. Route selection updates the same device-local preference consumed by Home and Route Studio. |
| Route Studio | `/{lang}/routes` | Edit route on Home line | Choose an authored route; see progress/lesson counts; reorder and skip/restore topics; reset authored order. Device-local preference drives Home line and next-step recommendation while shared evidence stays intact. |
| Lesson | `/{lang}/learn/{unitId}` | Route, map, next step, mission, Home resume card | Restore remaining step order, retry state, and session results from this device; answer through shared evaluator; record one event id; queue server sync; clear checkpoint on completion. |
| Knowledge map | `/{lang}/map` | Map tab, topic links | Search concepts, inspect state/prerequisites, open a lesson or planned topic. |
| Practice board | `/{lang}/practice` | Practice tab | Review weak topics; open review room; launch a scenario mission. |
| Review room | `/{lang}/review` | Practice due panel, Home recommendation | Sort overdue topics oldest-first; set 3/5/10 load; opt out individual topics; use least-seen authored question; answer through lesson flow and shared progress/outbox. |
| Mission | `/{lang}/mission/{unitId}` | Home mission, Practice mission list | Complete authored real-life reply turns with standard evaluator and progress events. |
| Reading library | `/{lang}/library` | Library tab | Browse original, level-labelled reading cards; open a story; see saved and due vocabulary counts. |
| Reading story | `/{lang}/library/{storyId}` | Library card | Read tokenized German text; select a marked word; inspect gloss and full sentence; save that token occurrence and context; navigate to vocabulary board. |
| Vocabulary board | `/{lang}/vocabulary` | Library CTA, story lookup panel | Review due words one at a time; reveal meaning; choose Again (10 minutes) or remembered (1/3/7/16/35 days); inspect list and remove an item. All vocabulary state is local to this browser. |
| Learner profile | `/{lang}/me` | You tab | View plan, account state, progress, reminders; import device history when eligible; export account progress; clear all device state including saved vocabulary, or delete account. |
| Sign-in start/callback | `/auth/start`, `/auth/callback` | Profile account panel | Start provider auth, handle callback, persist session cookie; profile age gate controls account use. |
| Session actions | `/auth/refresh`, `/auth/sign-out`, `/auth/delete` | Session refresher and profile | Refresh session, sign out, or delete account after explicit in-product confirmation. |
| Progress APIs | `/api/progress`, `/api/progress/import` | Shared progress client and profile import | Read no-store account history; validate/re-evaluate import batch and ignore duplicate event ids. |
| Attempt API | `/api/attempts` | Lesson/review shared outbox | Re-evaluate canonical answer, apply due-review rules, save append-only evidence idempotently. |
| Push APIs | `/api/push/subscribe`, `/api/push/cron` | Profile reminders, scheduled job | Store learner subscription and send scheduled reminders when deployment is configured. |

## Vocabulary record and interval flow

Each saved record is keyed by `storyId:paragraphIndex:tokenIndex`, so a lemma used in multiple sentences keeps each sense/context separate. A repeated save of that exact occurrence is idempotent. A first save is due after one minute for the pilot; a remembered response schedules 1, 3, 7, 16, or 35 days; Again resets to ten minutes. Removing a card deletes only that context record. Browser storage errors are reported in the UI.

`content/reading/stories.json` is the original text set. `apps/web/lib/reading.ts` loads and checks its minimal structure at build/render time. `apps/web/lib/vocabulary.ts` owns local state operations; `ReadingLibrary.tsx` implements the three screens. Before account sync ships, saved vocabulary needs the lexicon/sense contract (DG-050) and a progress API migration. The pilot does not create misleading account progress events.
