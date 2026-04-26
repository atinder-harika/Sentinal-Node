import { NextRequest, NextResponse } from "next/server";
import { insertCrisisEvent } from "@/lib/snowflake";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PushPayload {
  node_id?: string;
  event_type?: string;
  threat_details?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as PushPayload;

    if (!body.node_id || !body.event_type || !body.threat_details) {
      return NextResponse.json(
        {
          success: false,
          error: "node_id, event_type, and threat_details are required",
        },
        { status: 400 }
      );
    }

    await insertCrisisEvent({
      node_id: body.node_id,
      event_type: body.event_type,
      threat_details: body.threat_details,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}