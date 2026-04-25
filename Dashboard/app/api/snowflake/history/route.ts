/**
 * GET /api/snowflake/history — PRD §7.4
 * Out: { success, data: [...] }
 */
import { NextRequest, NextResponse } from "next/server";
import { wired } from "@/lib/sentinel-env";
import { fetchHistory } from "@/lib/snowflake";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface HistoryRow {
  timestamp: string;
  node_id: string;
  event_type: string;
  details: string;
}

interface HistoryResponse {
  success: boolean;
  data: HistoryRow[];
  source: "snowflake" | "mock";
  error?: string;
}

const MOCK_ROWS: HistoryRow[] = [
  {
    timestamp: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    node_id: "NODE-001",
    event_type: "THREAT_DETECTED",
    details: "Fire 0.92",
  },
  {
    timestamp: new Date(Date.now() - 1000 * 60 * 28).toISOString(),
    node_id: "NODE-002",
    event_type: "MOTION_DETECTED",
    details: "Movement at Node 2 (HC-SR04 22cm)",
  },
  {
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    node_id: "NODE-001",
    event_type: "SYSTEM_NOMINAL",
    details: "Heartbeat OK",
  },
];

export async function GET(req: NextRequest) {
  try {
    const limit = Number(req.nextUrl.searchParams.get("limit") ?? 50);

    if (!wired.snowflake) {
      return NextResponse.json<HistoryResponse>({
        success: true,
        data: MOCK_ROWS.slice(0, limit),
        source: "mock",
      });
    }

    const rows = await fetchHistory(limit);
    return NextResponse.json<HistoryResponse>({
      success: true,
      data: rows.map((r) => ({
        timestamp: typeof r.TIMESTAMP === "string" ? r.TIMESTAMP : new Date(r.TIMESTAMP).toISOString(),
        node_id: r.NODE_ID,
        event_type: r.EVENT_TYPE,
        details: r.DETAILS ?? "",
      })),
      source: "snowflake",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json<HistoryResponse>(
      { success: false, data: [], source: "snowflake", error: msg },
      { status: 500 }
    );
  }
}
