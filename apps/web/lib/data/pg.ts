/**
 * The only place in the app that opens a database connection (ADR-0002, ADR-0010).
 *
 * Two execution contexts, deliberately distinct:
 *   withLearner() — runs as the `authenticated` role with the learner's claims, so
 *                   row-level security decides what is visible and writable.
 *   withService() — runs as the service role for rows the schema forbids learners to
 *                   write (derived state, entitlements). Scoping is then the caller's
 *                   job, so every statement carries an explicit user_id.
 */
import "server-only";
import { Pool, type PoolClient } from "pg";

let pool: Pool | undefined;

export class DatabaseNotConfigured extends Error {
  constructor() {
    super("DATABASE_URL is not set: learner data cannot be stored in this deployment");
    this.name = "DatabaseNotConfigured";
  }
}

export function isConfigured(): boolean {
  return !!process.env.DATABASE_URL;
}

export function getPool(): Pool {
  if (!isConfigured()) throw new DatabaseNotConfigured();
  pool ??= new Pool({
    connectionString: process.env.DATABASE_URL,
    max: Number(process.env.DATABASE_POOL_MAX ?? 5),
    // Serverless functions are short-lived; do not hold connections open.
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 5_000,
    ...(process.env.DATABASE_SSL === "disable" ? {} : { ssl: { rejectUnauthorized: true } }),
  });
  return pool;
}

async function inTransaction<T>(setup: (c: PoolClient) => Promise<void>, fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query("begin");
    await setup(client);
    const result = await fn(client);
    await client.query("commit");
    return result;
  } catch (err) {
    await client.query("rollback").catch(() => {});
    throw err;
  } finally {
    // `set local` is undone by the transaction end; reset guards against a pooled
    // connection ever being handed out with a role still attached.
    await client.query("reset role").catch(() => {});
    client.release();
  }
}

/** Runs `fn` with RLS applied as this learner. */
export function withLearner<T>(userId: string, fn: (c: PoolClient) => Promise<T>): Promise<T> {
  return inTransaction(async (c) => {
    await c.query("set local role authenticated");
    // Parameterised: the claims are data, never concatenated SQL.
    await c.query("select set_config('request.jwt.claims', $1, true)", [
      JSON.stringify({ sub: userId, role: "authenticated" }),
    ]);
  }, fn);
}

/** Runs `fn` with the service role, which bypasses RLS. Scope every statement yourself. */
export function withService<T>(fn: (c: PoolClient) => Promise<T>): Promise<T> {
  return inTransaction(async (c) => {
    await c.query("set local role service_role");
  }, fn);
}
