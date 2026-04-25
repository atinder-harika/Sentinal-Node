import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface VisionPayload {
  image_base64?: string;
}

interface VisionResponse {
  success: boolean;
  threat_detected: boolean;
  threat_type: string;
  confidence: number;
}

interface VisionLikelihoodFace {
  sorrowLikelihood?: string;
  surpriseLikelihood?: string;
}

interface VisionLabel {
  description?: string;
  score?: number;
}

function normalizeBase64Image(input: string): string {
  return input.replace(/^data:image\/[a-zA-Z0-9.+-]+;base64,/, "").trim();
}

function hasAnyLabel(labels: string[], candidates: string[]): boolean {
  const lowered = labels.map((l) => l.toLowerCase());
  return candidates.some((candidate) => lowered.includes(candidate.toLowerCase()));
}

function clampConfidence(value: number): number {
  if (Number.isNaN(value) || !Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, Math.min(1, Number(value.toFixed(4))));
}

function extractThreat(
  labels: VisionLabel[],
  faceAnnotations: VisionLikelihoodFace[]
): { threat_detected: boolean; threat_type: string; confidence: number } {
  const labelTexts = labels
    .map((l) => (l.description ?? "").trim())
    .filter((v) => v.length > 0);

  const findBestLabelScore = (terms: string[]): number => {
    let best = 0;
    const lookup = new Set(terms.map((t) => t.toLowerCase()));
    for (const label of labels) {
      const text = (label.description ?? "").trim().toLowerCase();
      if (lookup.has(text)) {
        best = Math.max(best, label.score ?? 0);
      }
    }
    return best;
  };

  const gunTerms = ["Gun", "Weapon", "Firearm", "Assault rifle"];
  const fireTerms = ["Fire", "Flame", "Explosion"];
  const earthquakeTerms = ["Rubble", "Debris", "Blur", "Motion blur"];
  const injuryTerms = ["Blood", "Injury"];

  const faceDistress = faceAnnotations.some((face) => {
    const sorrow = face.sorrowLikelihood ?? "";
    const surprise = face.surpriseLikelihood ?? "";
    return (
      sorrow === "LIKELY" ||
      sorrow === "VERY_LIKELY" ||
      surprise === "LIKELY" ||
      surprise === "VERY_LIKELY"
    );
  });

  const hasGun = hasAnyLabel(labelTexts, gunTerms);
  const hasFire = hasAnyLabel(labelTexts, fireTerms);
  const hasEarthquake = hasAnyLabel(labelTexts, earthquakeTerms);
  const hasInjuryLabel = hasAnyLabel(labelTexts, injuryTerms);
  const hasDistressedCivilian = faceDistress || hasInjuryLabel;

  // Priority: Gunman > Fire > Earthquake > Distressed Civilian
  if (hasGun) {
    return {
      threat_detected: true,
      threat_type: "Active Shooter",
      confidence: clampConfidence(findBestLabelScore(gunTerms) || 0.9),
    };
  }

  if (hasFire) {
    return {
      threat_detected: true,
      threat_type: "Fire Detected",
      confidence: clampConfidence(findBestLabelScore(fireTerms) || 0.85),
    };
  }

  if (hasEarthquake) {
    return {
      threat_detected: true,
      threat_type: "Seismic Event / Structural Damage",
      confidence: clampConfidence(findBestLabelScore(earthquakeTerms) || 0.8),
    };
  }

  if (hasDistressedCivilian) {
    const labelConfidence = findBestLabelScore(injuryTerms);
    const faceConfidence = faceDistress ? 0.78 : 0;
    return {
      threat_detected: true,
      threat_type: "Civilian Casualty / Distressed Person",
      confidence: clampConfidence(Math.max(labelConfidence, faceConfidence)),
    };
  }

  return {
    threat_detected: false,
    threat_type: "None",
    confidence: 0,
  };
}

export async function POST(req: NextRequest) {
  try {
    if (!process.env.GCP_VISION_API_KEY) {
      throw new Error("Missing GCP_VISION_API_KEY");
    }

    const body = (await req.json()) as VisionPayload;
    if (!body?.image_base64 || typeof body.image_base64 !== "string") {
      throw new Error("Invalid payload: image_base64 is required");
    }

    const imageContent = normalizeBase64Image(body.image_base64);
    if (!imageContent) {
      throw new Error("Invalid payload: image_base64 is empty");
    }

    const endpoint = `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GCP_VISION_API_KEY}`;
    const googleResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({
        requests: [
          {
            image: { content: imageContent },
            features: [
              { type: "LABEL_DETECTION", maxResults: 15 },
              { type: "FACE_DETECTION", maxResults: 5 },
            ],
          },
        ],
      }),
    });

    if (!googleResponse.ok) {
      const failureText = await googleResponse.text();
      throw new Error(`Google Vision request failed: ${googleResponse.status} ${failureText}`);
    }

    const result = (await googleResponse.json()) as {
      responses?: Array<{
        labelAnnotations?: VisionLabel[];
        faceAnnotations?: VisionLikelihoodFace[];
        error?: { message?: string };
      }>;
    };

    const firstResponse = result.responses?.[0];
    if (!firstResponse) {
      throw new Error("Google Vision returned no responses");
    }

    if (firstResponse.error?.message) {
      throw new Error(`Google Vision API error: ${firstResponse.error.message}`);
    }

    const verdict = extractThreat(firstResponse.labelAnnotations ?? [], firstResponse.faceAnnotations ?? []);

    return NextResponse.json<VisionResponse>({
      success: true,
      threat_detected: verdict.threat_detected,
      threat_type: verdict.threat_type,
      confidence: verdict.confidence,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json<VisionResponse>(
      {
        success: false,
        threat_detected: false,
        threat_type: "None",
        confidence: 0,
      },
      { status: 500 }
    );
  }
}
