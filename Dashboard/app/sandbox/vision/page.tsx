"use client";

import Link from "next/link";
import { ChangeEvent, useMemo, useState } from "react";
import { ArrowLeft, Camera, Eye, RefreshCw } from "lucide-react";
import { TopNav } from "@/components/sentinel/top-nav";

interface VisionResult {
  success: boolean;
  threat_detected: boolean;
  threat_type?: string;
  confidence: number;
  boxes?: DetectionBox[];
  detections?: DetectionBox[];
  object_boxes?: DetectionBox[];
  objects?: DetectionBox[];
}

interface DetectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
  label?: string;
  confidence?: number;
}

export default function VisionPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [visionResult, setVisionResult] = useState<VisionResult | null>(null);
  const [error, setError] = useState<string>("");

  const normalizedResult = useMemo(() => {
    if (!visionResult) {
      return null;
    }

    return {
      threat_detected: visionResult.threat_detected,
      type: visionResult.threat_type ?? "None",
      confidence: visionResult.confidence,
    };
  }, [visionResult]);

  const detectedBoxes = useMemo(() => {
    if (!visionResult) {
      return [] as DetectionBox[];
    }

    return (
      visionResult.boxes ??
      visionResult.detections ??
      visionResult.object_boxes ??
      visionResult.objects ??
      []
    );
  }, [visionResult]);

  const handleFileUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setVisionResult(null);
    setError("");

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : null;
      setImageBase64(result);
    };
    reader.onerror = () => {
      setError("Failed to read image file.");
      setImageBase64(null);
    };

    reader.readAsDataURL(file);
  };

  const runVision = async () => {
    if (!imageBase64) {
      setError("Upload an image first.");
      return;
    }

    setIsProcessing(true);
    setError("");

    try {
      const response = await fetch("/api/vision", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          image_base64: imageBase64,
        }),
      });

      const data = (await response.json()) as VisionResult;
      if (!response.ok || !data.success) {
        throw new Error("Vision API request failed");
      }

      setVisionResult(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unexpected error";
      setError(message);
      setVisionResult(null);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="app-shell relative min-h-screen w-full bg-tactical overflow-x-hidden">
      <div className="bg-grid" />
      <div className="bg-edge" />
      <div className="grain" />

      <TopNav />

      <main className="app-shell-container relative z-10 px-6 pt-8 pb-24">
        {/* Header */}
        <header className="mb-8 flex flex-col gap-4 border-b border-white/[.08] pb-6">
          <Link
            href="/modules"
            className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors font-mono text-[10px] tracking-[0.28em] uppercase group w-fit"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to Modules</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center">
              <Camera className="w-5 h-5 text-white/70" />
            </div>
            <div>
              <h1 className="text-[28px] md:text-[36px] font-bold text-metal-tint tracking-tight">
                Vision · Edge Proxy
              </h1>
              <p className="text-[13px] text-white/50">
                Upload a test image, run Vision analysis, and inspect the returned threat JSON.
              </p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 backdrop-blur-sm border border-white/10">
                <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                <span className="font-mono text-[9px] tracking-[0.2em] text-white/40 uppercase">STBY</span>
              </div>
              <span className="badge-sandbox font-mono text-[9.5px] tracking-[0.28em] uppercase px-3 py-1 rounded-full">
                SANDBOX
              </span>
            </div>
          </div>
        </header>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Camera Feed Panel */}
          <div className="bento-card rounded-2xl p-6 bento-in">
            <span className="corner tl" />
            <span className="corner tr" />
            <span className="corner bl" />
            <span className="corner br" />

            <div className="flex items-center justify-between mb-4">
              <h2 className="font-mono text-[10px] tracking-[0.28em] uppercase text-white/50">
                Uploaded Image
              </h2>
              <div className="flex items-center gap-2">
                <span
                  className={`w-1.5 h-1.5 rounded-full ${isProcessing ? "bg-amber-300" : "bg-emerald-400"}`}
                />
                <span className="font-mono text-[10px] tracking-[0.2em] text-white/70">
                  {isProcessing ? "RUNNING" : "READY"}
                </span>
              </div>
            </div>

            <div className="relative aspect-video bg-black/60 rounded-lg overflow-hidden border border-white/10">
              {imageBase64 ? (
                <>
                  <img
                    src={imageBase64}
                    alt="Uploaded for vision analysis"
                    className="absolute inset-0 h-full w-full object-contain"
                  />

                  <svg
                    className="absolute inset-0 h-full w-full"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    aria-label="Detection overlays"
                  >
                    {detectedBoxes.map((box, idx) => {
                      const x = box.x * 100;
                      const y = box.y * 100;
                      const width = box.width * 100;
                      const height = box.height * 100;
                      const label = box.label ?? "object";
                      const confidence =
                        typeof box.confidence === "number"
                          ? ` ${(box.confidence * 100).toFixed(0)}%`
                          : "";

                      return (
                        <g key={`${idx}-${label}`}>
                          <rect
                            x={x}
                            y={y}
                            width={width}
                            height={height}
                            fill="transparent"
                            stroke="#f87171"
                            strokeWidth="0.5"
                            rx="0.6"
                          />
                          <text
                            x={x}
                            y={Math.max(y - 1, 3)}
                            fill="#fca5a5"
                            fontSize="2.5"
                            fontFamily="monospace"
                          >
                            {`${label}${confidence}`}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </>
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-center px-8">
                  <div>
                    <Camera className="w-14 h-14 text-white/20 mx-auto mb-2" />
                    <p className="font-mono text-[11px] text-white/40 uppercase tracking-[0.2em]">
                      No Image Selected
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <label
                htmlFor="vision-upload"
                className="font-mono text-[10px] tracking-[0.2em] uppercase text-white/60"
              >
                Upload Image
              </label>
              <input
                id="vision-upload"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="block w-full rounded-lg border border-white/10 bg-black/40 text-white/70 file:mr-4 file:rounded-md file:border-0 file:bg-white/10 file:px-3 file:py-2 file:text-white/80 file:font-mono file:text-[10px] file:tracking-[0.18em] file:uppercase"
              />

              <button
                onClick={runVision}
                disabled={isProcessing}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all font-mono text-[10px] tracking-[0.2em] uppercase text-white/70 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? "animate-spin" : ""}`} />
                {isProcessing ? "Analyzing..." : "Send to /api/vision"}
              </button>

              {error ? (
                <div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-300">
                  {error}
                </div>
              ) : null}

              {imageBase64 && detectedBoxes.length === 0 ? (
                <p className="text-[11px] text-white/45 font-mono">
                  Box overlay appears only if the Vision API returns bounding coordinates.
                </p>
              ) : null}
            </div>
          </div>

          <div className="bento-card rounded-2xl p-6 bento-in">
            <span className="corner tl" />
            <span className="corner tr" />
            <span className="corner bl" />
            <span className="corner br" />

            <div className="flex items-center justify-between mb-4">
              <h2 className="font-mono text-[10px] tracking-[0.28em] uppercase text-white/50">
                Vision JSON
              </h2>
              <Eye className="w-4 h-4 text-white/30" />
            </div>

            <div className="bg-black/40 backdrop-blur-md rounded-lg border border-white/5 p-4 font-mono text-[11px] max-h-[400px] overflow-auto">
              <pre className="text-white/70 whitespace-pre-wrap break-words">
{normalizedResult
  ? JSON.stringify(normalizedResult, null, 2)
  : JSON.stringify(
      {
        threat_detected: false,
        type: "None",
        confidence: 0,
      },
      null,
      2
    )}
              </pre>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-white/5 flex items-center justify-between font-mono text-[9px] tracking-[0.28em] uppercase text-white/30">
          <span>Vision Edge Proxy v1.2.0 · Cloud Vision API v1</span>
          <span>Upload · Analyze · Inspect JSON</span>
        </footer>
      </main>
    </div>
  );
}


