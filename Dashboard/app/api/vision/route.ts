/**
 * POST /api/vision  — PRD §7.1
 *
 * In:  { image_base64: "data:image/jpeg;base64,..." }
 * Out: { success, threat_detected, threat_type, confidence, raw_labels }
 *
 * Strategy: if Google Cloud Vision creds are present, call the real
 * ImageAnnotatorClient. Otherwise return a deterministic mock so the UI
 * still works before keys are plugged in.
 */
import { NextRequest, NextResponse } from "next/server";
import { env, wired, THREAT_KEYWORDS, THREAT_CONFIDENCE_THRESHOLD } from "@/lib/sentinel-env";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface VisionPayload {
  image_base64?: string;
}

interface VisionResponse {
  success: boolean;
  threat_detected: boolean;
  threat_type: string | null;
  confidence: number;
  raw_labels: string[];
  source: "google-vision" | "mock";
  error?: string;
}

function classify(labels: Array<{ description: string; score: number }>) {
  let best: { type: string; confidence: number; description: string } | null = null;
  for (const l of labels) {
    for (const k of THREAT_KEYWORDS) {
      if (k.match.test(l.description)) {
        if (!best || l.score > best.confidence) {
          best = { type: k.type, confidence: l.score, description: l.description };
        }
      }
    }
  }
  return best;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as VisionPayload;
    if (!body.image_base64) {
      return NextResponse.json<VisionResponse>(
        {
          success: false,
          threat_detected: false,
          threat_type: null,
          confidence: 0,
          raw_labels: [],
          source: "mock",
          error: "image_base64 missing",
        },
        { status: 400 }
      );
    }

    // Strip the data URL prefix if present.
    const b64 = body.image_base64.replace(/^data:image\/[a-zA-Z]+;base64,/, "");

    if (wired.vision) {
      try {
        // Lazy-load to avoid bundling Vision client when not wired.
        const { ImageAnnotatorClient } = await import("@google-cloud/vision");
        const credentials = env.GCP_SERVICE_ACCOUNT_JSON
          ? JSON.parse(env.GCP_SERVICE_ACCOUNT_JSON)
          : undefined;

        const client = new ImageAnnotatorClient(
          credentials
            ? { credentials, projectId: env.GCP_PROJECT_ID || credentials.project_id }
            : { apiKey: env.GCP_VISION_KEY }
        );

        const [result] = await client.annotateImage({
          image: { content: b64 },
          features: [
            { type: "LABEL_DETECTION", maxResults: 12 },
            { type: "SAFE_SEARCH_DETECTION" },
            { type: "OBJECT_LOCALIZATION", maxResults: 8 },
          ],
        });

        const labels = (result.labelAnnotations ?? []).map((l) => ({
          description: l.description ?? "",
          score: l.score ?? 0,
        }));
        const objects = (result.localizedObjectAnnotations ?? []).map((o) => ({
          description: o.name ?? "",
          score: o.score ?? 0,
        }));
        const all = [...labels, ...objects];
        const verdict = classify(all);
        const violenceLikelihood = result.safeSearchAnnotation?.violence;
        const violentBonus =
          violenceLikelihood === "VERY_LIKELY" ? 0.15 :
          violenceLikelihood === "LIKELY" ? 0.08 : 0;

        const confidence = verdict ? Math.min(1, verdict.confidence + violentBonus) : 0;
        return NextResponse.json<VisionResponse>({
          success: true,
          threat_detected: !!verdict && confidence >= THREAT_CONFIDENCE_THRESHOLD,
          threat_type: verdict?.type ?? null,
          confidence,
          raw_labels: all.map((l) => l.description).filter(Boolean),
          source: "google-vision",
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Vision SDK error";
        return NextResponse.json<VisionResponse>(
          {
            success: false,
            threat_detected: false,
            threat_type: null,
            confidence: 0,
            raw_labels: [],
            source: "google-vision",
            error: msg,
          },
          { status: 502 }
        );
      }
    }

    // ──────────────── Mock fallback ────────────────
    // Hash the first 512 bytes of the image so the same frame returns the
    // same mock result. Triggers a "Fire" threat ~35% of the time.
    const seed = b64.slice(0, 512).split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    const triggerThreat = (seed % 100) < 35;
    const mockLabels = triggerThreat
      ? ["Fire", "Smoke", "Heat", "Building", "Indoor"]
      : ["Person", "Indoor", "Wall", "Light", "Floor"];
    const verdict = classify(mockLabels.map((d) => ({ description: d, score: 0.92 })));

    return NextResponse.json<VisionResponse>({
      success: true,
      threat_detected: !!verdict,
      threat_type: verdict?.type ?? null,
      confidence: verdict ? 0.92 : 0.35,
      raw_labels: mockLabels,
      source: "mock",
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json<VisionResponse>(
      {
        success: false,
        threat_detected: false,
        threat_type: null,
        confidence: 0,
        raw_labels: [],
        source: "mock",
        error: msg,
      },
      { status: 500 }
    );
  }
}
