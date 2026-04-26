/**
 * /api/events/sync — Audio-thread polling endpoint for the Python edge nodes.
 *
 *   GET                                  → Snowflake active threats list
 *                                          (legacy behavior, used by dashboard)
 *   GET   ?node_id=NODE-002               → Returns the current dispatch
 *                                          envelope (with mp3 base64) for that
 *                                          node, OR { dispatch: null } when
 *                                          there is nothing pending or this
 *                                          node has already played it.
 *
 *   POST  body: { node_id, event_id, action: "ack" }
 *                                          Marks the dispatch as consumed by
 *                                          this node so it stops being served.
 */
import { NextRequest, NextResponse } from "next/server";
import { getActiveCrisisEvents } from "@/lib/snowflake";
import { getDispatch, markConsumed } from "@/lib/sentinel/state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const nodeId = url.searchParams.get("node_id");

  if (nodeId) {
    const dispatch = getDispatch();
    if (!dispatch) {
      return NextResponse.json({ success: true, dispatch: null });
    }
    // Detection node doesn't need to play its own evacuation alarm by default.
    // Set ?include_source=1 to override (useful for solo testing on one laptop).
    const includeSource = url.searchParams.get("include_source") === "1";
    if (!includeSource && dispatch.source_node_id === nodeId) {
      return NextResponse.json({ success: true, dispatch: null, reason: "source_node" });
    }
    if (dispatch.consumed_by.includes(nodeId)) {
      return NextResponse.json({ success: true, dispatch: null, reason: "already_consumed" });
    }
    return NextResponse.json({
      success: true,
      dispatch: {
        event_id: dispatch.event_id,
        source_node_id: dispatch.source_node_id,
        threat_type: dispatch.threat_type,
        confidence: dispatch.confidence,
        evacuation_message: dispatch.evacuation_message,
        rescue_notes: dispatch.rescue_notes,
        audio_base64: dispatch.audio_base64,
        dispatched_at: dispatch.dispatched_at,
      },
    });
  }

  // No node_id → legacy behavior: dashboard pulls Snowflake active threats.
  try {
    const rows = await getActiveCrisisEvents();
    return NextResponse.json({ success: true, active_threats: rows });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

interface AckBody {
  node_id?: string;
  event_id?: string;
  action?: string;
}

export async function POST(req: NextRequest) {
  let body: AckBody;
  try {
    body = (await req.json()) as AckBody;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const nodeId = (body.node_id ?? "").trim();
  const eventId = (body.event_id ?? "").trim();

  if (!nodeId || !eventId) {
    return NextResponse.json(
      { success: false, error: "node_id and event_id are required" },
      { status: 400 }
    );
  }

  const updated = markConsumed(nodeId, eventId);
  return NextResponse.json({
    success: true,
    acknowledged: updated,
  });
}
