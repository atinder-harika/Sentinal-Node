/**
 * POST /api/gemma — PRD §7.2
 *
 * In:  { threat_type: "Fire", location: "Main Hall" }
 * Out: { success, evacuation_message }
 *
 * Uses Google Generative AI SDK (Gemma/Gemini). Falls back to a hardcoded
 * directive on any failure, per PRD §5 fallback rules.
 */
import { NextRequest, NextResponse } from "next/server";
import { env, wired } from "@/lib/sentinel-env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface GemmaPayload {
  threat_type?: string;
  location?: string;
  extra_context?: string;
}

interface GemmaResponse {
  success: boolean;
  evacuation_message: string;
  source: "gemini" | "fallback";
  error?: string;
}

const SYSTEM_PROMPT = `You are SENTINEL-ROUTER, the evacuation routing brain
for a building's emergency mesh network. Given a threat type and a location,
output a single short audible directive (max 2 sentences, plain English, no
markdown, no JSON, no quotes). Tell people what was detected, where, and
which exit to take. Designate the North Exit stairwell as the default safe
route unless the threat is at the North Exit, in which case route to the
South Exit. Stay calm, authoritative, and clear.`;

function fallbackMessage(threatType?: string, location?: string) {
  const t = threatType ?? "Emergency";
  const where = location ? ` in ${location}` : "";
  return `Attention. ${t} detected${where}. Please evacuate the area immediately and proceed to the North Exit stairwell.`;
}

export async function POST(req: NextRequest) {
  let payload: GemmaPayload = {};
  try {
    payload = (await req.json()) as GemmaPayload;
  } catch {
    /* empty body is OK; fall through to fallback */
  }

  const threatType = payload.threat_type ?? "Emergency";
  const location = payload.location ?? "Main Hall";

  if (wired.gemma) {
    try {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({
        model: env.GEMINI_MODEL,
        systemInstruction: SYSTEM_PROMPT,
        generationConfig: {
          maxOutputTokens: 120,
          temperature: 0.2,
        },
      });

      const userPrompt = `Threat: ${threatType}. Location: ${location}.${
        payload.extra_context ? " Context: " + payload.extra_context : ""
      } Generate the evacuation directive.`;

      const result = await model.generateContent(userPrompt);
      const text = result.response.text().trim();
      if (!text) throw new Error("Empty Gemini response");

      return NextResponse.json<GemmaResponse>({
        success: true,
        evacuation_message: text,
        source: "gemini",
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Gemini error";
      return NextResponse.json<GemmaResponse>({
        success: true, // PRD §5: do not crash on Gemma failure
        evacuation_message: fallbackMessage(threatType, location),
        source: "fallback",
        error: msg,
      });
    }
  }

  return NextResponse.json<GemmaResponse>({
    success: true,
    evacuation_message: fallbackMessage(threatType, location),
    source: "fallback",
  });
}
