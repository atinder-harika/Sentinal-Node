import { NextResponse } from "next/server";
import { getActiveCrisisEvents } from "@/lib/snowflake";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const rows = await getActiveCrisisEvents();

    return NextResponse.json({
      success: true,
      active_threats: rows,
    });
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