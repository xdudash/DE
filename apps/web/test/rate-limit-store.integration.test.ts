/**
 * The Postgres counters for lib/rate-limit against the real table and service-role grants.
 * Requires a migrated database: `./scripts/db_prepare.sh NAME`, then
 * `DG_DB_URL=postgres://... npm test -w @deutschgo/web`. Without DG_DB_URL the suite skips.
 */
import { strict as assert } from "node:assert";
import { after, before, describe, it } from "node:test";
import { POLICY, bucketKey, expiresAtMs } from "../lib/rate-limit/policy.ts";
import { guard } from "../lib/rate-limit/limit.ts";

const url = process.env.DG_DB_URL;
let skip: string | false = url ? false : "set DG_DB_URL to a migrated database to run";

type Client = {
  connect(): Promise<void>;
  query(sql: string, values?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
  end(): Promise<void>;
};
let admin: Client | undefined;
let rateLimitStore: typeof import("../lib/data/rate-limit-store.ts").rateLimitStore;
let closePool: (() => Promise<void>) | undefined;

if (url) {
  process.env.DATABASE_URL = url;
  process.env.DATABASE_SSL = "disable";
  try {
    const mod = await import("pg");
    const pg = ((mod as { default?: unknown }).default ?? mod) as {
      Client: new (c: { connectionString: string; connectionTimeoutMillis: number }) => Client;
    };
    admin = new pg.Client({ connectionString: url, connectionTimeoutMillis: 5_000 });
    await admin.connect();
    ({ rateLimitStore } = await import("../lib/data/rate-limit-store.ts"));
    const { getPool } = await import("../lib/data/pg.ts");
    closePool = () => getPool().end();
  } catch (err) {
    await admin?.end().catch(() => {});
    admin = undefined;
    skip = `database unavailable (${(err as Error).message.split("\n")[0]})`;
  }
}

const T0 = 1_700_000_000_000 - (1_700_000_000_000 % 60_000);
const SUBJECT = `itest-${T0}`;

describe("rate-limit store on PostgreSQL", { skip }, () => {
  before(async () => {
    await admin?.query("delete from public.rate_limits where key like 'attempts:itest-%'");
  });

  it("counts hits in one row per subject and window", async () => {
    const store = rateLimitStore();
    const key = bucketKey(POLICY.attempts, SUBJECT, T0);
    const exp = expiresAtMs(POLICY.attempts, T0);
    assert.equal(await store.hit(key, exp), 1);
    assert.equal(await store.hit(key, exp), 2);
    const rows = await admin!.query("select hits from public.rate_limits where key = $1", [key]);
    assert.equal(rows.rows.length, 1);
    assert.equal(Number(rows.rows[0]!.hits), 2);
  });

  it("refuses over the limit through the same guard the routes use", async () => {
    const store = rateLimitStore();
    const small = { name: "attempts", limit: 2, windowSeconds: 60 } as const;
    const subject = `${SUBJECT}-guard`;
    assert.equal(await guard(store, small, subject, T0), null);
    assert.equal(await guard(store, small, subject, T0), null);
    const refused = await guard(store, small, subject, T0);
    assert.ok(refused);
    assert.equal(refused.status, 429);
  });

  after(async () => {
    await admin?.query("delete from public.rate_limits where key like 'attempts:itest-%'");
    await closePool?.();
    await admin?.end();
  });
});
