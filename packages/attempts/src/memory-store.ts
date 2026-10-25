/** In-memory store for tests and local experiments. Mirrors the SQL semantics. */
import type { LearningEvent } from "@deutschgo/learning-engine";
import type { ConceptStateRow, ReviewRow, Store, StoredEvent } from "./types.ts";

export class MemoryStore implements Store {
  readonly events = new Map<string, StoredEvent>();
  readonly states = new Map<string, ConceptStateRow>();
  readonly reviews = new Map<string, ReviewRow>();
  /** Counts calls, so tests can prove a replay does not write twice. */
  insertCalls = 0;

  async insertEvent(event: StoredEvent): Promise<{ inserted: boolean }> {
    this.insertCalls++;
    if (this.events.has(event.id)) return { inserted: false }; // primary key, like the table
    this.events.set(event.id, { ...event });
    return { inserted: true };
  }

  async insertEvents(events: StoredEvent[]): Promise<number> {
    this.insertCalls++;
    let inserted = 0;
    for (const event of events) {
      if (this.events.has(event.id)) continue;
      this.events.set(event.id, { ...event });
      inserted += 1;
    }
    return inserted;
  }

  async eventsForConcepts(conceptIds: string[]): Promise<LearningEvent[]> {
    const wanted = new Set(conceptIds);
    return [...this.events.values()]
      .filter((e) => e.conceptIds.some((c) => wanted.has(c)) || e.signals.some((c) => wanted.has(c)))
      .map((e) => ({
        id: e.id,
        kind: e.kind,
        at: Date.parse(e.occurredAt),
        contentId: e.contentId,
        localId: e.localId,
        conceptIds: e.conceptIds,
        signals: e.signals,
        skill: e.skill,
        correct: e.correct,
      }));
  }

  async saveConceptStates(rows: ConceptStateRow[]): Promise<void> {
    for (const r of rows) this.states.set(r.conceptId, { ...r });
  }

  async saveReviewItems(rows: ReviewRow[]): Promise<void> {
    for (const r of rows) this.reviews.set(r.itemRef, { ...r });
  }
}
