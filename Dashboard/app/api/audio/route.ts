import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AudioPayload {
  text?: string;
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.ELEVENLABS_API_KEY) {
      throw new Error("Missing ELEVENLABS_API_KEY");
    }

    const payload = (await req.json()) as AudioPayload;
    const text = (payload.text ?? "").trim();
    if (!text) {
      throw new Error("Invalid payload: text is required");
    }

    const voiceId = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";
    const endpoint = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;

    const elevenResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "xi-api-key": process.env.ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: process.env.ELEVENLABS_MODEL_ID || "eleven_turbo_v2_5",
      }),
    });

    if (!elevenResponse.ok) {
      const failureText = await elevenResponse.text();
      throw new Error(`ElevenLabs request failed: ${elevenResponse.status} ${failureText}`);
    }

    const audioBuffer = await elevenResponse.arrayBuffer();
    return new NextResponse(audioBuffer, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
      },
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
      },
      { status: 500 }
    );
  }
}
