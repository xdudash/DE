/**
 * The age-gate write against a real PostgreSQL with the real schema and RLS.
 * Requires a migrated database: `./scripts/db_prepare.sh NAME`, then
 * `DG_DB_URL=postgres://... npm test -w @deutschgo/web`. Without DG_DB_URL it skips.
 */
import { strict as assert } from "node:assert";
import { randomUUID } from "node:crypto";
import { after, before, describe, it } from "node:test";

const url = process.env.DG_DB_URL;
const skip: string | false = url ? false : "set DG_DB_URL to a migrated database to run";

type Client = {
  connect(): Promise<void>;
  query(sql: string, values?: unknown[]): Promise<{ rows: Record<string, unknown>[]; rowCount: number | null }>;
  end(): Promise<void>;
};
let admin: Client | undefined;
let ageGateStore: typeof import("../lib/data/profile-store.ts").ageGateStore;
let closePool: (() => Promise<void>) | undefined;

const ALICE = randomUUID();
const BOB = randomUUID();

/** Connects inside a hook, so a connection failure is reported as a named test failure. */
async function connect(): Promise<void> {
  if (!url) return;
  process.env.DATABASE_URL = url;
  process.env.DATABASE_SSL = "disable";
  const mod = await import("pg");
  const pg = ((mod as { default?: unknown }).default ?? mod) as {
    Client: new (c: { connectionString: string; connectionTimeoutMillis: number }) => Client;
  };
  admin = new pg.Client({ connectionString: url, connectionTimeoutMillis: 5_000 });
  await admin.connect();
  ({ ageGateStore } = await import("../lib/data/profile-store.ts"));
  const { getPool } = await import("../lib/data/pg.ts");
  closePool = () => getPool().end();
}

const db = (): Client => {
  if (!admin) throw new Error("no admin connection");
  return admin;
};

describe("age gate against PostgreSQL", { skip, timeout: 30_000 }, () => {
  after(async () => {
    await closePool?.().catch(() => {});
    await admin?.end().catch(() => {});
  });

  before(async () => {
    await connect();
    for (const id of [ALICE, BOB]) {
      await db().query("insert into auth.users (id, email) values ($1, $2)", [id, `${id}@example.test`]);
    }
  });

  it("creates the profile row with the assertion set, and is idempotent", async () => {
    await ageGateStore(ALICE).confirmAge(ALICE);
    await ageGateStore(ALICE).confirmAge(ALICE);
    const { rows, rowCount } = await db().query("select age_confirmed from public.profiles where user_id = $1", [ALICE]);
    assert.equal(rowCount, 1);
    assert.equal(rows[0]!.age_confirmed, true);
  });

  it("does not touch another learner's profile", async () => {
    const { rows } = await db().query("select age_confirmed from public.profiles where user_id = $1", [BOB]);
    assert.equal(rows.length, 0, "Bob has no profile row because nothing confirmed for him");
  });

  it("refuses to write an assertion for a different learner", async () => {
    await assert.rejects(ageGateStore(ALICE).confirmAge(BOB), /another learner/);
  });
});
