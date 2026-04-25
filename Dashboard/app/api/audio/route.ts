/**
 * POST /api/audio — PRD §7.3
 *
 * In:  { text: "Fire detected in Main Hall..." }
 * Out: { success, audio_base64: "...", mime: "audio/mpeg" }   (success path)
 *      { success: false, error }                              (failure)
 *
 * Calls the ElevenLabs streaming TTS endpoint and returns base64-encoded
 * MP3 so the browser can play it via `new Audio('data:audio/mp3;base64,...')`.
 *
 * Per PRD §5, the *client* falls back to window.speechSynthesis on failure.
 */
import { NextRequest, NextResponse } from "next/server";
import { env, wired } from "@/lib/sentinel-env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AudioPayload {
  text?: string;
  voice_id?: string;
}

interface AudioResponse {
  success: boolean;
  audio_base64?: string;
  mime?: string;
  source: "elevenlabs" | "mock";
  error?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as AudioPayload;
    const text = (body.text ?? "").trim();
    if (!text) {
      return NextResponse.json<AudioResponse>(
        { success: false, source: "mock", error: "text missing" },
        { status: 400 }
      );
    }

    if (wired.audio) {
      try {
        const voiceId = body.voice_id ?? env.ELEVENLABS_VOICE_ID;
        const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "xi-api-key": env.ELEVENLABS_API_KEY,
            "Content-Type": "application/json",
            Accept: "audio/mpeg",
          },
          body: JSON.stringify({
            text,
            model_id: env.ELEVENLABS_MODEL_ID,
            voice_settings: {
              stability: 0.55,
              similarity_boost: 0.75,
              style: 0.4,
              use_speaker_boost: true,
            },
          }),
        });

        if (!res.ok) {
          const errBody = await res.text();
          throw new Error(`ElevenLabs ${res.status}: ${errBody.slice(0, 200)}`);
        }

        const arrayBuf = await res.arrayBuffer();
        const audio_base64 = Buffer.from(arrayBuf).toString("base64");
        return NextResponse.json<AudioResponse>({
          success: true,
          audio_base64,
          mime: "audio/mpeg",
          source: "elevenlabs",
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "ElevenLabs error";
        return NextResponse.json<AudioResponse>(
          { success: false, source: "elevenlabs", error: msg },
          { status: 502 }
        );
      }
    }

    // Mock: no audio, client should hit speechSynthesis fallback.
    return NextResponse.json<AudioResponse>({
      success: false,
      source: "mock",
      error: "ELEVENLABS_API_KEY not configured — client should fall back to speechSynthesis",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json<AudioResponse>(
      { success: false, source: "mock", error: msg },
      { status: 500 }
    );
  }
}
