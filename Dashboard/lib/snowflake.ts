/**
 * Snowflake helpers — single connection promise, table bootstrap, log + history.
 * Wrapped in try/catch by the API routes; this module only resolves a typed
 * client when env credentials are present.
 */
import { env, wired } from "@/lib/sentinel-env";

export interface ThreatLogRow {
  TIMESTAMP: string;
  NODE_ID: string;
  EVENT_TYPE: string;
  DETAILS: string;
}

let cachedConnPromise: Promise<unknown> | null = null;

async function getConnection() {
  if (!wired.snowflake) {
    throw new Error("Snowflake credentials not configured");
  }
  if (cachedConnPromise) return cachedConnPromise;

  cachedConnPromise = (async () => {
    const snowflake = (await import("snowflake-sdk")) as typeof import("snowflake-sdk");
    const conn = snowflake.createConnection({
      account: env.SNOWFLAKE_ACCOUNT,
      username: env.SNOWFLAKE_USERNAME,
      password: env.SNOWFLAKE_PASSWORD,
      database: env.SNOWFLAKE_DATABASE,
      schema: env.SNOWFLAKE_SCHEMA,
      warehouse: env.SNOWFLAKE_WAREHOUSE,
      ...(env.SNOWFLAKE_ROLE ? { role: env.SNOWFLAKE_ROLE } : {}),
    });

    await new Promise<void>((resolve, reject) => {
      conn.connect((err) => (err ? reject(err) : resolve()));
    });

    // Idempotent bootstrap of the alerts table.
    await execSql(
      conn,
      `CREATE TABLE IF NOT EXISTS THREAT_ALERTS (
         TIMESTAMP   TIMESTAMP_NTZ DEFAULT CURRENT_TIMESTAMP(),
         NODE_ID     STRING,
         EVENT_TYPE  STRING,
         DETAILS     STRING
       )`
    );

    return conn;
  })();

  return cachedConnPromise;
}

function execSql<T = unknown>(conn: unknown, sql: string, binds: unknown[] = []) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const c = conn as any;
  return new Promise<T[]>((resolve, reject) => {
    c.execute({
      sqlText: sql,
      binds,
      complete: (err: Error | undefined, _stmt: unknown, rows: T[] | undefined) => {
        if (err) reject(err);
        else resolve(rows ?? []);
      },
    });
  });
}

export async function logThreat(row: {
  node_id: string;
  event_type: string;
  details: string;
}) {
  const conn = await getConnection();
  await execSql(
    conn,
    `INSERT INTO THREAT_ALERTS (NODE_ID, EVENT_TYPE, DETAILS) VALUES (?, ?, ?)`,
    [row.node_id, row.event_type, row.details]
  );
  return { success: true };
}

export async function fetchHistory(limit = 50) {
  const conn = await getConnection();
  const rows = await execSql<ThreatLogRow>(
    conn,
    `SELECT TIMESTAMP, NODE_ID, EVENT_TYPE, DETAILS
       FROM THREAT_ALERTS
       ORDER BY TIMESTAMP DESC
       LIMIT ?`,
    [limit]
  );
  return rows;
}
