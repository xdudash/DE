# ADR-0019: Audio for lessons and reviewer roles
- Status: Accepted (delegated to the agent on 2026-10-24: "сам решай")
- Date: 2026-10-24
- Decision owner: Project owner (delegated)

## Context
Lessons need listening and pronunciation audio (DG-053). Audio is German speech, so it is produced by a text-to-speech (TTS) service or a local model. Two constraints apply: learner data must not leave the EU, and the project has no budget line yet. Reviewers are needed for the gold unit (DG-007), but no person has been named, and the agent may not invent one.

## Options considered
1. **Azure AI Speech (neural voices), generated offline.** German voices exist for Germany (de-DE), Austria (de-AT) and Switzerland (de-CH), which matches the product's scope. The free tier is 0.5 million neural characters per month; beyond it, billing is per character. Generation runs in advance from our scripts, so no learner text is sent at runtime.
2. **Piper (open source, runs locally).** No per-character cost and no data leaves our machines. German voices exist, but the licence differs per voice and must be checked voice by voice. Quality is lower than neural cloud voices.
3. **Runtime TTS on each learner request.** Rejected: every play would send learner-visible text to a provider and cost money per use.

## Decision
- Audio is generated **offline, ahead of time**, by a script (to be written in DG-053) from the German text in `content/`. It is cached by a hash of voice and text, so an unchanged sentence is never generated twice.
- **Primary provider: Azure AI Speech (neural)**, with voices for de-DE, de-AT and de-CH. The owner creates the Azure resource and stores the key as a secret (never in the repository). The agent cannot create the account.
- **Fallback: Piper**, used only for voices whose licence is confirmed in writing to allow commercial use of the generated audio.
- Storage of generated files is decided with DG-053 once the volume is known. Until then, files are not committed.
- Cost estimate, to be verified before scale-up: the full course has about 5000 lessons. At a few hundred German characters of spoken text per lesson, the total is several million characters, above the free tier. The owner must approve the budget before the full run.

## Reviewer roles
Reviewers are people. The agent cannot name them, so the roles are recorded here and in `docs/quality/REVIEWERS.md` as **unassigned**:
- German linguist (native speaker or qualified teacher): grammar, examples, audio check.
- Pedagogy reviewer: level fit, load per lesson, exercise quality.
- Ukrainian and Russian translation reviewers: explanations in uk and ru.
- Rights reviewer: sources and licence confirmation (DG-007).
A lesson is not approved until its roles have signed off in the `review` block.

## Consequences
- No learner text reaches a provider at runtime. Privacy risk is limited to the offline generation step.
- The gold unit stays `needs_review` until a linguist and a pedagogy reviewer are assigned and sign off.
- Costs appear only after the owner creates the Azure resource and approves a budget.

## Verification
- Documentation only. No provider is called and no key is stored. The offline script is part of DG-053 and will be tested with a fake provider.
