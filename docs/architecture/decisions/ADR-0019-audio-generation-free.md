# ADR-0019: Free, offline audio for lessons
- Status: Accepted (delegated to the agent on 2026-10-24; the owner asked for a free solution)
- Date: 2026-10-24
- Decision owner: Project owner (delegated)

## Context
Lessons need German listening and pronunciation audio (DG-053). The owner wants no paid service, so cloud speech services with per-character billing are out. Learner data must not leave the project for audio.

## Options considered
1. **Piper, run locally, generated ahead of time.** Free, open source, no per-character cost, no runtime provider. The Piper model code is MIT. The German voice `de_DE-thorsten` (high quality) has a model card that names the dataset Thorsten-Voice under CC0. Piper has no Austrian or Swiss voices, so the same voice serves all three countries; regional differences are carried by the text.
2. **Cloud neural voices (for example Azure).** Better regional voices, but a paid service with a free tier far below the full course. Rejected by the owner's requirement.
3. **Runtime speech on each request.** Rejected: sends learner-visible text to a provider on every play.

## Decision
- Audio is generated **offline** by a script (to be written in DG-053) from the German text in `content/`, using Piper with the `de_DE-thorsten-high` voice. Output is cached by a hash of voice and text, so an unchanged sentence is generated once.
- No provider and no key are used. The learner app only plays stored files.
- Before any generated file is published, the voice's model card must still show CC0 for the dataset and MIT for the model. If that changes, generation stops.
- Storage of generated files is decided in DG-053 once the volume is measured. Files are not committed until then.

## Consequences
- Audio quality is that of an open local voice, not a commercial one. The owner accepts this as the free option.
- Regional German (Austrian and Swiss accents) is not voiced; it is taught in text. This is a known limitation.
- Human approval is still required before any lesson is marked approved (CLAUDE.md principle 4). This ADR does not change that rule and names no reviewers.

## Verification
- Documentation only. No audio is generated and no model is downloaded. The script will be tested with a fake voice in DG-053.
