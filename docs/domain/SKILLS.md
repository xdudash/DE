# Four Skills: Activities and Honest Assessment

Status: **Accepted** design (2026-10-12). Implementation phases P4–P5 ([roadmap](../development/ROADMAP.md)).

Rule: a skill is shown as "practised" or "assessed" only if a real activity for that skill exists, and the UI states **how** it was evaluated: `automatic` (deterministic), `heuristic` (AI/ASR-assisted, may be wrong), or `human` (reviewer).

## Reading (P4)
- Graded texts (original or licensed) with level, region, register; tap-to-lookup via lexicon (context sense).
- Tasks: global/detail comprehension, true/false/not given, matching headings, reference resolution, form/letter comprehension (Behörden).
- Evaluation: automatic.

## Listening (P5)
- Real audio: commissioned recordings by native speakers from DE/AT/CH (preferred) and licensed datasets after rights review; synthetic speech (TTS) only for vocabulary/pronunciation aids, always labelled "synthetic", never as listening-comprehension material.
- Player: replay segments, speed 0.75/1.0, transcript after the task, region label of the speaker.
- Tasks: gist, detail, dictation (cloze), announcement/voicemail comprehension.
- Evaluation: automatic. Storage/delivery: [ADR-0007](../architecture/decisions/ADR-0007-media-and-audio.md).

## Writing (P5)
- Tasks state purpose, audience, register, length, and a rubric (task fulfilment, coherence, range, accuracy).
- Automatic checks: required elements, length, salutation/closing for letters, targeted form checks.
- AI-assisted feedback (premium, opt-in): labelled heuristic, shows rubric-aligned comments, never a CEFR grade. Prompts and outputs are not used for training; data handling per [data & privacy](../architecture/DATA_AND_PRIVACY.md).
- Human review: later option (P8), not promised earlier.

## Speaking and pronunciation (P5)
- Activity types kept distinct: **shadowing** (imitate model audio), **prepared speech** (answer a prompt), **role-play** (scripted turns), **minimal pairs** (perception first).
- Recording stays on device by default; upload only with explicit consent for a feature that needs it.
- ASR-based checks (did the learner say the expected words?) are labelled heuristic; **no pronunciation score** until a validated method exists (evaluation dataset + agreement with human raters recorded in an ADR).

## Skill progress
Per skill: activities completed, automatic results, and (where present) heuristic/human feedback counts — never merged into one opaque number.
