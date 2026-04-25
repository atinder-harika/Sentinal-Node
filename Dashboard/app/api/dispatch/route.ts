/**
 * POST /api/dispatch
 *
 * Pushes the orchestrated payload (threat + audio buffer) to Node 2 (the Pi)
 * over the local Ethernet network. Reads the Pi address from env. This is the
 * Vultr-side dispatch step described in PRD §2 / §9 Phase 4.
 *
 * In:  { threat_type, location, evacuation_message, audio_base64? }
 * Out: { success, dispatched, error? }
 */
import { NextRequest, NextResponse } from "next/server";
import { env, wired } from "@/lib/sentinel-env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface DispatchPayload {
  threat_type?: string;
  location?: string;
  evacuation_message?: string;
  audio_base64?: string;
  node_id?: string;
}

interface DispatchResponse {
  success: boolean;
  dispatched: boolean;
  source: "node2" | "mock";
  error?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as DispatchPayload;

    if (!wired.node2) {
      console.log(
        "[dispatch-mock]",
        body.node_id ?? "NODE-002",
        body.threat_type,
        body.location,
        (body.evacuation_message ?? "").slice(0, 80)
      );
      return NextResponse.json<DispatchResponse>({
        success: true,
        dispatched: false,
        source: "mock",
      });
    }

    const res = await fetch(env.NODE2_PUSH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      // Pi is on local Ethernet — keep the timeout tight.
      signal: AbortSignal.timeout(4000),
    });

    if (!res.ok) {
      const errBody = await res.text();
      throw new Error(`Node 2 ${res.status}: ${errBody.slice(0, 200)}`);
    }
    return NextResponse.json<DispatchResponse>({
      success: true,
      dispatched: true,
      source: "node2",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "dispatch error";
    return NextResponse.json<DispatchResponse>(
      { success: false, dispatched: false, source: "node2", error: msg },
      { status: 502 }
    );
  }
}
