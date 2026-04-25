import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface GemmaPayload {
  threat_type?: string;
  location?: string;
  safe_zones?: string[];
  civilian_transcript?: string;
}

interface GemmaResponse {
  success: boolean;
  evacuation_message: string;
  rescue_notes: string;
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error("Missing GEMINI_API_KEY");
    }

    if (!process.env.GEMINI_MODEL) {
      throw new Error("Missing GEMINI_MODEL");
    }

    const payload = (await req.json()) as GemmaPayload;
    if (
      !payload?.threat_type ||
      !payload?.location ||
      !Array.isArray(payload?.safe_zones)
    ) {
      throw new Error("Invalid payload: threat_type, location, and safe_zones are required");
    }

    if (payload.safe_zones.length === 0) {
      throw new Error("Invalid payload: safe_zones must include at least one zone");
    }

    const threatType = payload.threat_type;
    const location = payload.location;
    const safeZones = payload.safe_zones;
    const civilianTranscript = payload.civilian_transcript ?? "";

    const prompt = `You are Sentinel, an emergency routing AI. A ${threatType} has been detected at ${location}. The current safe zones are: ${safeZones.join(", ")}. Civilian audio intercepted: "${civilianTranscript || "None"}". CRITICAL INSTRUCTION: 1. Provide a direct, calm evacuation command directing civilians to a safe zone (Under 15 words). 2. If the audio implies trapped or injured individuals, generate a brief rescue_notes string for SWAT/Firefighters pointing out what to look for.`;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${process.env.GEMINI_MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const modelResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              success: {
                type: "BOOLEAN",
              },
              evacuation_message: {
                type: "STRING",
                description: "A single clean sentence without bullet points or newlines under 15 words",
              },
              rescue_notes: {
                type: "STRING",
                description:
                  "Concise notes for First Responders about injured/trapped civilians based on the transcript. If none, return 'No casualties identified.'",
              },
            },
            required: ["success", "evacuation_message", "rescue_notes"],
          },
        },
      }),
    });

    if (!modelResponse.ok) {
      const failureText = await modelResponse.text();
      throw new Error(`Gemini request failed: ${modelResponse.status} ${failureText}`);
    }

    const modelJson = (await modelResponse.json()) as {
      candidates?: Array<{
        content?: {
          parts?: Array<{ text?: string }>;
        };
      }>;
      error?: { message?: string };
    };

    if (modelJson.error?.message) {
      throw new Error(`Gemini API error: ${modelJson.error.message}`);
    }

    const candidateText = modelJson.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
    let modelSuccess = true;
    let evacuationMessage = "";
    let rescueNotes = "";
    if (candidateText) {
      try {
        const parsed = JSON.parse(candidateText) as Record<string, unknown>;
        modelSuccess = typeof parsed.success === "boolean" ? parsed.success : true;
        evacuationMessage =
          typeof parsed.evacuation_message === "string" ? parsed.evacuation_message.trim() : "";
        rescueNotes = typeof parsed.rescue_notes === "string" ? parsed.rescue_notes.trim() : "";
      } catch {
        evacuationMessage = candidateText;
        rescueNotes = "No casualties identified.";
      }
    }

    if (!evacuationMessage) {
      throw new Error("Gemini response did not include evacuation text");
    }

    const normalizedMessage = evacuationMessage.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
    const normalizedRescueNotes = (rescueNotes || "No casualties identified.")
      .replace(/[\r\n]+/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!normalizedMessage) {
      throw new Error("Gemini response was empty after normalization");
    }

    if (!normalizedRescueNotes) {
      throw new Error("Gemini response did not include rescue notes");
    }

    return NextResponse.json<GemmaResponse>({
      success: modelSuccess,
      evacuation_message: normalizedMessage,
      rescue_notes: normalizedRescueNotes,
    });
  } catch {
    return NextResponse.json<GemmaResponse>(
      {
        success: false,
        evacuation_message: "",
        rescue_notes: "",
      },
      { status: 500 }
    );
  }
}
