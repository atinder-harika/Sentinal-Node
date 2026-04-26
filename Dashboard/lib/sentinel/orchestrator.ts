/**
 * Sentinel Node - Crisis Loop orchestrator (server-side).
 *
 * Pure helper functions so /api/node/frame can run the full
 * Vision -> Gemma -> ElevenLabs chain inside a single POST without bouncing
 * through fetch back to its own routes.
 */
import { insertCrisisEvent } from "@/lib/snowflake";

export interface VisionVerdict {
  threat_detected: boolean;
  threat_type: string;
  confidence: number;
}

export interface EvacuationPlan {
  evacuation_message: string;
  rescue_notes: string;
}

interface VisionLabel {
  description?: string;
  score?: number;
}

interface VisionFace {
  sorrowLikelihood?: string;
  surpriseLikelihood?: string;
}

const GUN_TERMS = ["Gun", "Weapon", "Firearm", "Assault rifle"];
const FIRE_TERMS = ["Fire", "Flame", "Explosion"];
const EARTHQUAKE_TERMS = ["Rubble", "Debris", "Blur", "Motion blur"];
const INJURY_TERMS = ["Blood", "Injury"];

function normalizeBase64(input: string): string {
  return input.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "").trim();
}

function clampConfidence(value: number): number {
  if (Number.isNaN(value) || !Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, Number(value.toFixed(4))));
}

function hasAnyLabel(labels: string[], candidates: string[]): boolean {
  const lowered = labels.map((l) => l.toLowerCase());
  return candidates.some((c) => lowered.includes(c.toLowerCase()));
}

function bestLabelScore(labels: VisionLabel[], terms: string[]): number {
  const lookup = new Set(terms.map((t) => t.toLowerCase()));
  let best = 0;
  for (const label of labels) {
    const text = (label.description ?? "").trim().toLowerCase();
    if (lookup.has(text)) {
      best = Math.max(best, label.score ?? 0);
    }
  }
  return best;
}

function extractThreat(labels: VisionLabel[], faces: VisionFace[]): VisionVerdict {
  const labelTexts = labels
    .map((l) => (l.description ?? "").trim())
    .filter((v) => v.length > 0);

  const faceDistress = faces.some((f) => {
    const sorrow = f.sorrowLikelihood ?? "";
    const surprise = f.surpriseLikelihood ?? "";
    return (
      sorrow === "LIKELY" ||
      sorrow === "VERY_LIKELY" ||
      surprise === "LIKELY" ||
      surprise === "VERY_LIKELY"
    );
  });

  if (hasAnyLabel(labelTexts, GUN_TERMS)) {
    return {
      threat_detected: true,
      threat_type: "Active Shooter",
      confidence: clampConfidence(bestLabelScore(labels, GUN_TERMS) || 0.9),
    };
  }
  if (hasAnyLabel(labelTexts, FIRE_TERMS)) {
    return {
      threat_detected: true,
      threat_type: "Fire Detected",
      confidence: clampConfidence(bestLabelScore(labels, FIRE_TERMS) || 0.85),
    };
  }
  if (hasAnyLabel(labelTexts, EARTHQUAKE_TERMS)) {
    return {
      threat_detected: true,
      threat_type: "Seismic Event / Structural Damage",
      confidence: clampConfidence(bestLabelScore(labels, EARTHQUAKE_TERMS) || 0.8),
    };
  }
  if (hasAnyLabel(labelTexts, INJURY_TERMS) || faceDistress) {
    const labelConfidence = bestLabelScore(labels, INJURY_TERMS);
    const faceConfidence = faceDistress ? 0.78 : 0;
    return {
      threat_detected: true,
      threat_type: "Civilian Casualty / Distressed Person",
      confidence: clampConfidence(Math.max(labelConfidence, faceConfidence)),
    };
  }

  return { threat_detected: false, threat_type: "None", confidence: 0 };
}

export async function analyzeFrame(imageBase64: string): Promise<VisionVerdict> {
  const apiKey = process.env.GCP_VISION_API_KEY;
  if (!apiKey) {
    throw new Error("Missing GCP_VISION_API_KEY");
  }
  const content = normalizeBase64(imageBase64);
  if (!content) {
    throw new Error("Empty image_base64");
  }

  const endpoint = "https://vision.googleapis.com/v1/images:annotate?key=" + apiKey;
  const resp = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({
      requests: [
        {
          image: { content },
          features: [
            { type: "LABEL_DETECTION", maxResults: 15 },
            { type: "FACE_DETECTION", maxResults: 5 },
          ],
        },
      ],
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error("Google Vision request failed: " + resp.status + " " + text);
  }

  const json = (await resp.json()) as {
    responses?: Array<{
      labelAnnotations?: VisionLabel[];
      faceAnnotations?: VisionFace[];
      error?: { message?: string };
    }>;
  };

  const first = json.responses?.[0];
  if (!first) throw new Error("Google Vision returned no responses");
  if (first.error?.message) {
    throw new Error("Google Vision API error: " + first.error.message);
  }

  return extractThreat(first.labelAnnotations ?? [], first.faceAnnotations ?? []);
}

export async function generateEvacuationPlan(args: {
  threat_type: string;
  location: string;
  safe_zones: string[];
  civilian_transcript?: string;
  /** When the threat has moved between nodes, the previous source for Gemma to mention. */
  previous_location?: string;
}): Promise<EvacuationPlan> {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL;
  if (!apiKey) throw new Error("Missing GEMINI_API_KEY");
  if (!model) throw new Error("Missing GEMINI_MODEL");

  const transcript = args.civilian_transcript ?? "";
  const moveNote =
    args.previous_location && args.previous_location !== args.location
      ? "IMPORTANT: The threat has just moved from " +
        args.previous_location +
        " to " +
        args.location +
        ". Tell civilians the threat has shifted and to redirect."
      : "";

  const prompt =
    "You are Sentinel, an emergency routing AI. A " +
    args.threat_type +
    " has been detected at " +
    args.location +
    ". " +
    moveNote +
    " The current safe zones are: " +
    args.safe_zones.join(", ") +
    '. Civilian audio intercepted: "' +
    (transcript || "None") +
    '". CRITICAL INSTRUCTION: 1. Provide a direct, calm evacuation command directing civilians to a safe zone (Under 18 words). If the threat moved, briefly mention the move so people in the previous zone know they are now safe. 2. If the audio implies trapped or injured individuals, generate a brief rescue_notes string for SWAT/Firefighters pointing out what to look for.';

  const endpoint =
    "https://generativelanguage.googleapis.com/v1beta/models/" +
    model +
    ":generateContent?key=" +
    apiKey;
  const resp = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            success: { type: "BOOLEAN" },
            evacuation_message: { type: "STRING" },
            rescue_notes: { type: "STRING" },
          },
          required: ["success", "evacuation_message", "rescue_notes"],
        },
      },
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error("Gemini request failed: " + resp.status + " " + text);
  }

  const json = (await resp.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    error?: { message?: string };
  };

  if (json.error?.message) {
    throw new Error("Gemini API error: " + json.error.message);
  }

  const text = json.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  if (!text) throw new Error("Gemini returned no text");

  let evacuation = "";
  let rescue = "No casualties identified.";
  try {
    const parsed = JSON.parse(text) as Record<string, unknown>;
    if (typeof parsed.evacuation_message === "string") {
      evacuation = parsed.evacuation_message.trim();
    }
    if (typeof parsed.rescue_notes === "string" && parsed.rescue_notes.trim()) {
      rescue = parsed.rescue_notes.trim();
    }
  } catch {
    evacuation = text;
  }

  evacuation = evacuation.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
  rescue = rescue.replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();

  if (!evacuation) throw new Error("Gemini response was empty");
  return { evacuation_message: evacuation, rescue_notes: rescue };
}

export async function synthesizeEvacuationAudio(text: string): Promise<Buffer> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("Missing ELEVENLABS_API_KEY");
  const trimmed = text.trim();
  if (!trimmed) throw new Error("Empty text for TTS");

  const voiceId = process.env.ELEVENLABS_VOICE_ID || "21m00Tcm4TlvDq8ikWAM";
  const modelId = process.env.ELEVENLABS_MODEL_ID || "eleven_turbo_v2_5";
  const endpoint = "https://api.elevenlabs.io/v1/text-to-speech/" + voiceId;

  const resp = await fetch(endpoint, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: trimmed, model_id: modelId }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    throw new Error("ElevenLabs request failed: " + resp.status + " " + text);
  }

  const buf = await resp.arrayBuffer();
  return Buffer.from(buf);
}

export async function logCrisisToSnowflake(input: {
  node_id: string;
  event_type: string;
  threat_details: string;
}): Promise<void> {
  try {
    await insertCrisisEvent(input);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[sentinel] Snowflake insert failed:", err);
  }
}
