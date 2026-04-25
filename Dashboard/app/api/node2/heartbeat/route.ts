/**
 * POST /api/node2/heartbeat
 *
 * Endpoint the Raspberry Pi (Node 2) pings on its own to (a) confirm it's
 * online and (b) report HC-SR04 motion events when the Lights-Out fallback
 * routine fires (PRD §2 — "Movement at Node 2"). Logs to Snowflake when
 * wired up.
 *
 * In:  { node_id?: "NODE-002", kind: "ALIVE" | "MOTION", distance_cm?: number }
 * Out: { success }
 */
import { NextRequest, NextResponse } from "next/server";
import { wired } from "@/lib/sentinel-env";
import { logThreat } from "@/lib/snowflake";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface HeartbeatPayload {
  node_id?: string;
  kind?: "ALIVE" | "MOTION";
  distance_cm?: number;
}

interface HeartbeatResponse {
  success: boolean;
  source: "snowflake" | "mock";
  error?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as HeartbeatPayload;
    const node_id = body.node_id ?? "NODE-002";
    const event_type = body.kind === "MOTION" ? "MOTION_DETECTED" : "HEARTBEAT";
    const details =
      body.kind === "MOTION"
        ? `Movement at ${node_id}${
            body.distance_cm !== undefined ? ` (HC-SR04 ${body.distance_cm}cm)` : ""
          }`
        : `Heartbeat ${node_id}`;

    if (!wired.snowflake) {
      console.log("[node2-mock]", node_id, event_type, details);
      return NextResponse.json<HeartbeatResponse>({ success: true, source: "mock" });
    }

    await logThreat({ node_id, event_type, details });
    return NextResponse.json<HeartbeatResponse>({ success: true, source: "snowflake" });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json<HeartbeatResponse>(
      { success: false, source: "snowflake", error: msg },
      { status: 500 }
    );
  }
}
