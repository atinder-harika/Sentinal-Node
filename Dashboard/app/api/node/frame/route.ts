/**
 * /api/node/frame - Edge node ingest endpoint (PRD section 7).
 *
 *   POST  body: { node_id, image_base64 }
 *         Stores latest frame, runs Vision in the background. If a fresh
 *         threat is detected and we're not already in a crisis lock window,
 *         spins up the Gemma + ElevenLabs chain and stashes the dispatch
 *         envelope for sibling nodes to pick up via /api/events/sync.
 *
 *   GET   ?node_id=NODE-001 -> latest frame for that node
 *         (no query)        -> all known frames + crisis envelope.
 */
import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import {
  clearInFlight,
  getDispatch,
  getFrame,
  getLastAnalyzedAt,
  getSentinelState,
  isInFlight,
  isLocked,
  listFrames,
  lockUntil,
  markInFlight,
  putFrame,
  setDispatch,
  setLastAnalyzedAt,
  type DispatchEnvelope,
  type FrameSnapshot,
} from "@/lib/sentinel/state";
import {
  analyzeFrame,
  generateEvacuationPlan,
  logCrisisToSnowflake,
  synthesizeEvacuationAudio,
} from "@/lib/sentinel/orchestrator";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CRISIS_LOCK_MS = 60_000;
/** Minimum gap between Vision calls per node. Saves API credits. */
const VISION_THROTTLE_MS = 6_000;
const SAFE_ZONES = ["North Exit Stairwell"];

interface FramePostBody {
  node_id?: string;
  image_base64?: string;
  /** When true, this frame is stored only - no Vision pass / orchestration. */
  skip_analysis?: boolean;
}

export async function POST(req: NextRequest) {
  let body: FramePostBody;
  try {
    body = (await req.json()) as FramePostBody;
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const nodeId = (body.node_id ?? "").trim();
  const imageBase64 = (body.image_base64 ?? "").trim();
  if (!nodeId || !imageBase64) {
    return NextResponse.json(
      { success: false, error: "node_id and image_base64 are required" },
      { status: 400 }
    );
  }

  const snapshot: FrameSnapshot = {
    node_id: nodeId,
    image_base64: imageBase64,
    captured_at: Date.now(),
  };
  putFrame(snapshot);

  if (body.skip_analysis) {
    return NextResponse.json({
      success: true,
      analyzed: false,
      threat_detected: false,
      reason: "skip_analysis flag set",
      crisis_active: getDispatch() !== null,
    });
  }

  if (isLocked()) {
    return NextResponse.json({
      success: true,
      analyzed: false,
      threat_detected: false,
      reason: "crisis lock active - vision paused",
      crisis_active: true,
    });
  }

  const now = Date.now();
  const sinceLast = now - getLastAnalyzedAt(nodeId);
  if (sinceLast < VISION_THROTTLE_MS) {
    return NextResponse.json({
      success: true,
      analyzed: false,
      threat_detected: false,
      reason: `throttled (${Math.round(sinceLast)}ms since last)`,
      crisis_active: getDispatch() !== null,
    });
  }

  if (isInFlight(nodeId)) {
    return NextResponse.json({
      success: true,
      analyzed: false,
      threat_detected: false,
      reason: "previous frame still in flight",
      crisis_active: getDispatch() !== null,
    });
  }

  markInFlight(nodeId);
  setLastAnalyzedAt(nodeId, now);
  try {
    const verdict = await analyzeFrame(imageBase64);

    const stored = getFrame(nodeId);
    if (stored) {
      stored.threat_detected = verdict.threat_detected;
      stored.threat_type = verdict.threat_type;
      stored.confidence = verdict.confidence;
    }

    if (!verdict.threat_detected) {
      return NextResponse.json({
        success: true,
        analyzed: true,
        threat_detected: false,
        crisis_active: getDispatch() !== null,
      });
    }

    if (isLocked()) {
      return NextResponse.json({
        success: true,
        analyzed: true,
        threat_detected: true,
        threat_type: verdict.threat_type,
        confidence: verdict.confidence,
        dispatched: false,
        reason: "crisis lock window active",
        crisis_active: true,
      });
    }

    const plan = await generateEvacuationPlan({
      threat_type: verdict.threat_type,
      location: nodeId,
      safe_zones: SAFE_ZONES,
    });

    const audioBuffer = await synthesizeEvacuationAudio(plan.evacuation_message);

    const dispatch: DispatchEnvelope = {
      event_id: randomUUID(),
      source_node_id: nodeId,
      threat_type: verdict.threat_type,
      confidence: verdict.confidence,
      evacuation_message: plan.evacuation_message,
      rescue_notes: plan.rescue_notes,
      audio_base64: audioBuffer.toString("base64"),
      dispatched_at: Date.now(),
      consumed_by: [],
    };
    setDispatch(dispatch);
    lockUntil(Date.now() + CRISIS_LOCK_MS);

    void logCrisisToSnowflake({
      node_id: nodeId,
      event_type: verdict.threat_type,
      threat_details: plan.evacuation_message,
    });

    return NextResponse.json({
      success: true,
      analyzed: true,
      threat_detected: true,
      threat_type: verdict.threat_type,
      confidence: verdict.confidence,
      dispatched: true,
      event_id: dispatch.event_id,
      evacuation_message: plan.evacuation_message,
      rescue_notes: plan.rescue_notes,
      crisis_active: true,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  } finally {
    clearInFlight(nodeId);
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const nodeId = url.searchParams.get("node_id");

  if (nodeId) {
    const frame = getFrame(nodeId);
    if (!frame) {
      return NextResponse.json(
        { success: false, error: `No frame yet for ${nodeId}` },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, frame });
  }

  const frames = listFrames();
  const dispatch = getDispatch();
  const state = getSentinelState();

  return NextResponse.json({
    success: true,
    frames,
    crisis: dispatch
      ? {
          event_id: dispatch.event_id,
          source_node_id: dispatch.source_node_id,
          threat_type: dispatch.threat_type,
          confidence: dispatch.confidence,
          evacuation_message: dispatch.evacuation_message,
          rescue_notes: dispatch.rescue_notes,
          dispatched_at: dispatch.dispatched_at,
          consumed_by: dispatch.consumed_by,
        }
      : null,
    crisis_lock_until: state.crisisLockUntil,
    server_now: Date.now(),
  });
}

/**
 * Convenience reset for the demo - wipes dispatch + lock so the next threat
 * frame triggers a fresh Gemma/ElevenLabs run. Frames are kept (so the live
 * tile doesn't go blank).
 */
export async function DELETE() {
  setDispatch(null);
  lockUntil(0);
  return NextResponse.json({ success: true, reset: true });
}
