# External Source Register

Status: updated 2026-10-12. Machine-readable registry: [`content/sources.yaml`](../../content/sources.yaml) — only sources with `status: approved` may be referenced by content (validator-enforced).

## Strategy
1. **Original editorial content first** (explanations, examples, exercises, graded texts written for DeutschGo) — full rights, consistent quality.
2. **Licensed open data** where it measurably improves quality (frequency, example candidates, speech for evaluation), after a pilot and per-asset rights check.
3. **Link-only** to high-quality external resources (public broadcasters, Goethe, official authority pages) with our own description.
4. **Never** copy commercial textbooks, exam materials, dictionary entries, or audio without a written license.

## Candidates (license facts verified where marked ✔; re-verify at ingestion)
| Resource | Candidate use | License / terms | Commercial display? | Decision |
|---|---|---|---|---|
| [Tatoeba](https://tatoeba.org/en/downloads) | example-sentence candidates, translations | ✔ Sentences CC BY 2.0 FR (part CC0); audio licensed per contributor, empty license = no reuse | Yes with attribution per sentence (CC BY); quality varies | candidate — pilot in P4 with editorial filtering and per-item attribution |
| [Mozilla Common Voice](https://commonvoice.mozilla.org/en/datasets) | speech for ASR evaluation research | CC0 (per release; verify) | Legally yes; read speech, not natural dialogue | candidate — research/evaluation only, not listening lessons |
| [Leipzig Corpora Collection](https://wortschatz.uni-leipzig.de/en/download) | word frequency for vocabulary selection | Terms page not machine-readable from this session; to verify manually | unknown | candidate — verify terms (DG-005) |
| Wiktionary (German/English/Russian/Ukrainian) | lexical cross-checks (forms, gender) | CC BY-SA 4.0 (share-alike) | Share-alike would bind derived entries | reference only unless SA obligations accepted |
| [DW Learn German](https://learngerman.dw.com/) | external learner resource | DW terms; content not freely reusable | no | link-only |
| [Goethe-Institut](https://www.goethe.de/) | exam context, references | copyright | no | link-only; never copy word lists/test items |
| [Duden](https://www.duden.de/) | reference | commercial | no | research reference only |
| [IDS grammis](https://grammis.ids-mannheim.de/) | grammar reference | IDS terms | no (without permission) | research reference only |
| Official authority sites (BAMF, AMS, oesterreich.gv.at, ch.ch) | scenario fact-checking | public information; texts copyrighted | no copying | link + paraphrase with "last verified" date |

## Required metadata for imported material
Internal source id; provider and exact URL/identifier; download date and version; license URL/version; allowed uses (`link_only`, `internal_research`, `display`, `modify`, `redistribute`, `commercial`); attribution text; item-level provenance; transformations; reviewer; refresh/removal plan.

## Rules
Public ≠ free to reuse. Dataset licenses may not cover each item (e.g., audio). Do not scrape or bulk-download unless terms allow it. Never call a source "free to use" without verifying exact license and intended use. Keep credentials and private download links out of Git.
