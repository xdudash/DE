/**
 * The attempt pipeline against a real PostgreSQL with the real schema and RLS.
 * Requires a migrated database: `./scripts/db_prepare.sh NAME`, then
 * `DG_DB_URL=postgres://... npm test -w @deutschgo/web`.
 * Without DG_DB_URL (or without `pg` installed) the suite skips with a reason.
 */
import { strict as assert } from "node:assert";
import { randomUUID } from "node:crypto";
import { after, before, describe, it } from "node:test";
import { recordAttempt } from "@deutschgo/attempts";
import { T0, UNIT_VERSION, V2, bundle, request as attemptBody } from "../../../packages/attempts/test/fixtures.ts";

const url = process.env.DG_DB_URL;
let skip: string | false = url ? false : "set DG_DB_URL to a migrated database to run";

type Client = {
  connect(): Promise<void>;
  query(sql: string, values?: unknown[]): Promise<{ rows: Record<string, unknown>[]; rowCount: number | null }>;
  end(): Promise<void>;
};
let admin: Client;
let attemptStore: typeof import("../lib/data/attempt-store.ts").attemptStore;
let closePool: () => Promise<void>;

const ALICE = randomUUID();
const BOB = randomUUID();

// Narrowing on `url` rather than on `skip`: the compiler can follow the former.
if (url) {
  process.env.DATABASE_URL = url;
  process.env.DATABASE_SSL = "disable";
  try {
    // pg is CommonJS: take the default namespace when the loader provides one.
    const mod = await import("pg");
    const pg = ((mod as { default?: unknown }).default ?? mod) as {
      Client: new (c: { connectionString: string; connectionTimeoutMillis: number }) => Client;
    };
    // An explicit timeout: an unreachable host must fail the suite, never hang it.
    admin = new pg.Client({ connectionString: url, connectionTimeoutMillis: 5_000 });
    await admin.connect();
    ({ attemptStore } = await import("../lib/data/attempt-store.ts"));
    const { getPool } = await import("../lib/data/pg.ts");
    closePool = () => getPool().end();
  } catch (err) {
    skip = `database unavailable (${(err as Error).message.split("\n")[0]})`;
  }
}

describe("attempt recording against PostgreSQL", { skip }, () => {
  // Closing in `after` rather than in a final test: a failing assertion must not leave
  // an open pool behind, or the test runner waits for handles that never close.
  after(async () => {
    await closePool?.().catch(() => {});
    await admin?.end().catch(() => {});
  });

  before(async () => {
    for (const id of [ALICE, BOB]) {
      await admin.query("insert into auth.users (id, email) values ($1, $2)", [id, `${id}@example.test`]);
      await admin.query("insert into public.profiles (user_id, explanation_lang) values ($1, 'uk')", [id]);
    }
  });

  const record = (userId: string, over = {}, now = T0) =>
    recordAttempt(attemptBody({ contentVersion: UNIT_VERSION, ...over }), {
      bundle: bundle(), store: attemptStore(userId), userId, now,
    });

  it("stores the event, the derived state and the review schedule", async () => {
    const out = await record(ALICE);
    assert.equal(out.correct, true);
    assert.equal(out.recorded, true);

    const events = await admin.query("select * from public.learning_events where user_id = $1", [ALICE]);
    assert.equal(events.rowCount, 1);
    assert.equal(events.rows[0]!.correct, true);
    assert.equal(events.rows[0]!.evaluator_version, "1.0.0");
    assert.deepEqual(events.rows[0]!.concept_ids, [V2]);

    const states = await admin.query("select * from public.concept_states where user_id = $1", [ALICE]);
    assert.equal(states.rows[0]!.state, "in_progress");
    const reviews = await admin.query("select * from public.review_items where user_id = $1", [ALICE]);
    assert.equal(reviews.rows[0]!.interval_days, 1);
  });

  it("is idempotent across retries of the same event id", async () => {
    const body = attemptBody();
    const first = await recordAttempt(body, { bundle: bundle(), store: attemptStore(ALICE), userId: ALICE, now: T0 });
    const second = await recordAttempt(body, { bundle: bundle(), store: attemptStore(ALICE), userId: ALICE, now: T0 });
    assert.equal(first.recorded, true);
    assert.equal(second.recorded, false);
    const { rowCount } = await admin.query("select 1 from public.learning_events where id = $1", [body.eventId]);
    assert.equal(rowCount, 1);
  });

  it("recomputes state from stored evidence: three wrong answers mean needs_practice", async () => {
    const wrong = { response: { type: "word_order" as const, order: [2, 0, 3, 1] } };
    let out = await record(BOB, wrong);
    assert.equal(out.states[0]!.state, "in_progress");
    await record(BOB, wrong);
    out = await record(BOB, wrong);
    assert.equal(out.states[0]!.state, "needs_practice");
    assert.equal(out.states[0]!.because, "low_recent_accuracy");
    const { rows } = await admin.query("select signals from public.learning_events where user_id = $1 limit 1", [BOB]);
    assert.deepEqual(rows[0]!.signals, [V2]);
  });

  it("keeps learners apart: row-level security hides another learner's events", async () => {
    const aliceEvents = await attemptStore(ALICE).eventsForConcepts([V2]);
    const bobEvents = await attemptStore(BOB).eventsForConcepts([V2]);
    assert.ok(aliceEvents.length > 0 && bobEvents.length > 0);
    assert.equal(aliceEvents.some((e) => bobEvents.some((b) => b.id === e.id)), false);
    const all = await admin.query("select count(*)::int as n from public.learning_events");
    assert.equal(all.rows[0]!.n, aliceEvents.length + bobEvents.length);
  });

  it("refuses to store an event attributed to someone else", async () => {
    const store = attemptStore(ALICE);
    await assert.rejects(
      () => store.insertEvent({
        id: randomUUID(), userId: BOB, kind: "attempt", occurredAt: new Date(T0).toISOString(),
        contentId: "unit.syntax.v2_declarative.a1", localId: "x_order", contentVersion: UNIT_VERSION,
        conceptIds: [V2], signals: [], skill: "knowledge", correct: true, score: 1, evaluatorVersion: "1.0.0",
      }),
      /another learner/,
    );
  });

  it("cannot update or delete stored evidence, even as the learner", async () => {
    const { rows } = await admin.query("select id from public.learning_events where user_id = $1 limit 1", [ALICE]);
    const id = rows[0]!.id;
    const { withLearner } = await import("../lib/data/pg.ts");
    await assert.rejects(() => withLearner(ALICE, (c) => c.query("update public.learning_events set correct = true where id = $1", [id])));
    await assert.rejects(() => withLearner(ALICE, (c) => c.query("delete from public.learning_events where id = $1", [id])));
    const still = await admin.query("select 1 from public.learning_events where id = $1", [id]);
    assert.equal(still.rowCount, 1);
  });

  it("leaves no pooled connection with a role attached", async () => {
    const { withService, withLearner } = await import("../lib/data/pg.ts");
    await withService((c) => c.query("select 1"));
    const { rows } = await withLearner(ALICE, (c) => c.query("select current_user as who"));
    assert.equal(rows[0]!.who, "authenticated");
    const released = await admin.query("select current_user as who");
    assert.notEqual(released.rows[0]!.who, "authenticated");
  });

});
