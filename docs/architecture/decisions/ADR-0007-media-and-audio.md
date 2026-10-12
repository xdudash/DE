# ADR-0007: Media and audio

- Status: Proposed — to be decided at the start of P5 (no audio is shipped before then)
- Date: 2026-10-12

## Context
Listening needs real audio from DE/AT/CH speakers; files are large; rights must be per asset; Git is unsuitable for many binaries.

## Proposed direction
- Audio assets in object storage with CDN (Cloudflare R2 or Supabase Storage; compare egress cost at decision time); **manifests in Git** (`content/resources/*.yaml`: id, speaker variety, transcript, duration, checksum, license, consent record reference).
- Source priority: commissioned recordings with written license and speaker consent > licensed datasets after review (e.g. CC0 speech corpora — note that crowd-sourced read speech is not natural conversation) > synthetic TTS, labelled, for vocabulary/pronunciation aids only.
- Formats: Opus/AAC at modest bitrates; loudness normalised; transcripts aligned per sentence.

## Open questions
Recording budget and partners; storage provider; whether TTS voices' license permits commercial e-learning use (check per vendor).
