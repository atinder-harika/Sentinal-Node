/**
 * POST /api/node/dispatch — operator-initiated broadcast.
 *
 * Lets the dashboard's "Responder Override" trigger a synthetic mesh dispatch
 * without going through the Vision/Gemma chain. ElevenLabs is called
 * server-side and the resulting envelope is stored exactly like an automated
 * crisis dispatch, so every non-source node.py audio thread will pick it up
 * via /api/events/sync.
 *
 * In:  { evacuation_message: string,
 *        source_node_id?: string,        (default "OPERATOR")
 *        threat_type?: string,            (default "Manual Override") }
 * Out: { success, event_id?, error? }
 */
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import {
  lockUntil,
  setDispatch,
  type DispatchEnvelope,
} from "@/lib/sentinel/state";
import {
  logCrisisToSnowflake,
  synthesizeEvacuationAudio,
} from "@/lib/sentinel/orchestrator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CRISIS_LOCK_MS = 60_000;

interface DispatchBody {
  evacuation_message?: string;
  source_node_id?: string;
  threat_type?: string;
  rescue_notes?: string;
}

export async function POST(req: NextRequest) {
  let body: DispatchBody;
  try {
    body = (await req.json()) as DispatchBody;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const message = (body.evacuation_message ?? "").trim();
  if (!message) {
    return NextResponse.json(
      { success: false, error: "evacuation_message is required" },
      { status: 400 }
    );
  }

  const sourceNodeId = (body.source_node_id ?? "OPERATOR").trim();
  const threatType = (body.threat_type ?? "Manual Override").trim();
  const rescueNotes = (body.rescue_notes ?? "Operator-initiated broadcast.").trim();

  try {
    const audioBuffer = await synthesizeEvacuationAudio(message);

    const dispatch: DispatchEnvelope = {
      event_id: randomUUID(),
      source_node_id: sourceNodeId,
      threat_type: threatType,
      confidence: 1.0,
      evacuation_message: message,
      rescue_notes: rescueNotes,
      audio_base64: audioBuffer.toString("base64"),
      dispatched_at: Date.now(),
      consumed_by: [],
    };
    setDispatch(dispatch);
    lockUntil(Date.now() + CRISIS_LOCK_MS);

    void logCrisisToSnowflake({
      node_id: sourceNodeId,
      event_type: `MANUAL_${threatType.toUpperCase().replace(/\s+/g, "_")}`,
      threat_details: message.slice(0, 240),
    });

    return NextResponse.json({
      success: true,
      event_id: dispatch.event_id,
      threat_type: threatType,
      source_node_id: sourceNodeId,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
