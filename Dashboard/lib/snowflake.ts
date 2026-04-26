import { randomUUID } from "node:crypto";
import type { Connection, RowStatement } from "snowflake-sdk";

export interface ThreatLogRow {
  TIMESTAMP: string;
  NODE_ID: string;
  EVENT_TYPE: string;
  THREAT_DETAILS?: string;
  DETAILS?: string;
  IS_ACTIVE?: boolean;
}

interface SnowflakeCredentials {
  account: string;
  username: string;
  password: string;
  role?: string;
  warehouse?: string;
}

let cachedConnectionPromise: Promise<Connection> | null = null;

function getCredentials(): SnowflakeCredentials {
  const creds: SnowflakeCredentials = {
    account: process.env.SNOWFLAKE_ACCOUNT ?? "",
    username: process.env.SNOWFLAKE_USERNAME ?? "",
    password: process.env.SNOWFLAKE_PASSWORD ?? "",
    role: process.env.SNOWFLAKE_ROLE,
    warehouse: process.env.SNOWFLAKE_WAREHOUSE,
  };

  if (!creds.account || !creds.username || !creds.password) {
    throw new Error("Snowflake credentials are not configured");
  }

  return creds;
}

export async function getSnowflakeConnection(): Promise<Connection> {
  if (cachedConnectionPromise) {
    return cachedConnectionPromise;
  }

  cachedConnectionPromise = (async () => {
    const snowflake = (await import("snowflake-sdk")) as typeof import("snowflake-sdk");
    const credentials = getCredentials();
    const connection = snowflake.createConnection({
      account: credentials.account,
      username: credentials.username,
      password: credentials.password,
      ...(credentials.role ? { role: credentials.role } : {}),
      ...(credentials.warehouse ? { warehouse: credentials.warehouse } : {}),
    });

    await new Promise<void>((resolve, reject) => {
      connection.connect((err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });

    return connection;
  })();

  return cachedConnectionPromise;
}

export async function executeSnowflake<T = Record<string, unknown>>(
  sqlText: string,
  binds: unknown[] = []
): Promise<T[]> {
  const connection = await getSnowflakeConnection();

  return new Promise<T[]>((resolve, reject) => {
    connection.execute({
      sqlText,
      binds: binds as never,
      complete: (err: Error | undefined, _stmt: RowStatement, rows: T[] | undefined) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows ?? []);
      },
    });
  });
}

export async function insertCrisisEvent(input: {
  node_id: string;
  event_type: string;
  threat_details: string;
}) {
  // CRISIS_EVENTS.ID is NOT NULL with no default. Snowflake rejects
  // UUID_STRING() inline in a VALUES clause, so generate the UUID in Node.
  const id = randomUUID();
  await executeSnowflake(
    "INSERT INTO SENTINEL_DB.PUBLIC.CRISIS_EVENTS (ID, NODE_ID, EVENT_TYPE, THREAT_DETAILS) VALUES (?, ?, ?, ?)",
    [id, input.node_id, input.event_type, input.threat_details]
  );

  return { success: true, id };
}

export async function getActiveCrisisEvents() {
  return executeSnowflake<ThreatLogRow>(
    "SELECT * FROM CRISIS_EVENTS WHERE IS_ACTIVE = TRUE ORDER BY TIMESTAMP DESC"
  );
}

export async function logThreat(row: {
  node_id: string;
  event_type: string;
  details: string;
}) {
  const id = randomUUID();
  await executeSnowflake(
    "INSERT INTO SENTINEL_DB.PUBLIC.CRISIS_EVENTS (ID, NODE_ID, EVENT_TYPE, THREAT_DETAILS) VALUES (?, ?, ?, ?)",
    [id, row.node_id, row.event_type, row.details]
  );

  return { success: true, id };
}

export async function fetchHistory(limit = 50) {
  const rows = await executeSnowflake<ThreatLogRow>(
    "SELECT TIMESTAMP, NODE_ID, EVENT_TYPE, THREAT_DETAILS, IS_ACTIVE FROM SENTINEL_DB.PUBLIC.CRISIS_EVENTS ORDER BY TIMESTAMP DESC LIMIT ?",
    [limit]
  );

  return rows;
}
