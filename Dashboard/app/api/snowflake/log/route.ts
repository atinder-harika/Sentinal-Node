/**
 * POST /api/snowflake/log — PRD §7.4
 * In:  { node_id, event_type, details }
 * Out: { success }
 */
import { NextRequest, NextResponse } from "next/server";
import { wired } from "@/lib/sentinel-env";
import { logThreat } from "@/lib/snowflake";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface LogPayload {
  node_id?: string;
  event_type?: string;
  details?: string;
}

interface LogResponse {
  success: boolean;
  source: "snowflake" | "mock";
  error?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as LogPayload;
    if (!body.node_id || !body.event_type) {
      return NextResponse.json<LogResponse>(
        { success: false, source: "mock", error: "node_id + event_type required" },
        { status: 400 }
      );
    }

    if (!wired.snowflake) {
      // Mock: log to server console, return success so the UI flow continues.
      console.log("[snowflake-mock]", body.node_id, body.event_type, body.details);
      return NextResponse.json<LogResponse>({ success: true, source: "mock" });
    }

    await logThreat({
      node_id: body.node_id,
      event_type: body.event_type,
      details: body.details ?? "",
    });
    return NextResponse.json<LogResponse>({ success: true, source: "snowflake" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json<LogResponse>(
      { success: false, source: "snowflake", error: msg },
      { status: 500 }
    );
  }
}
