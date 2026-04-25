"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { ArrowLeft, Camera, Eye, AlertTriangle, Check, RefreshCw } from "lucide-react";
import { TopNav } from "@/components/sentinel/top-nav";

const MOCK_LABELS = [
  { description: "Person", score: 0.97, topicality: 0.97 },
  { description: "Crowd", score: 0.89, topicality: 0.89 },
  { description: "Street", score: 0.85, topicality: 0.85 },
  { description: "Urban area", score: 0.82, topicality: 0.78 },
  { description: "Vehicle", score: 0.76, topicality: 0.72 },
  { description: "Building", score: 0.71, topicality: 0.68 },
];

const THREAT_KEYWORDS = ["fire", "smoke", "weapon", "flood", "explosion"];

function LiveTimestamp() {
  const [time, setTime] = useState(new Date().toISOString());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date().toISOString()), 1000);
    return () => clearInterval(id);
  }, []);
  return <span>{time}</span>;
}

export default function VisionPage() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [labels, setLabels] = useState(MOCK_LABELS);
  const [frameCount, setFrameCount] = useState(1247);

  const runInference = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setFrameCount((c) => c + 1);
      setLabels(
        MOCK_LABELS.map((l) => ({
          ...l,
          score: Math.min(0.99, l.score + (Math.random() - 0.5) * 0.1),
        }))
      );
      setIsProcessing(false);
    }, 800);
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
                Mocked webcam feed → Cloud Vision JSON. Inspect labels the edge proxy emits.
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
                Edge Camera Feed
              </h2>
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,.8)] blink" />
                <span className="font-mono text-[10px] tracking-[0.2em] text-emerald-400">LIVE</span>
              </div>
            </div>

            {/* Mock video feed */}
            <div className="relative aspect-video bg-black/60 rounded-lg overflow-hidden border border-white/10">
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-800/50 to-zinc-900/80" />
              
              {/* Simulated camera overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Camera className="w-16 h-16 text-white/20 mx-auto mb-3" />
                  <p className="font-mono text-[11px] text-white/30">SIMULATED FEED</p>
                  <p className="font-mono text-[10px] text-white/20 mt-1">node-098 · sector-7G</p>
                </div>
              </div>

              {/* HUD overlay */}
              <div className="absolute top-3 left-3 font-mono text-[9px] text-emerald-400/80">
                <div>REC · Frame {frameCount}</div>
                <div className="text-white/40 mt-1"><LiveTimestamp /></div>
              </div>

              {/* Detection boxes (simulated) */}
              <div className="absolute top-1/4 left-1/4 w-20 h-28 border border-emerald-400/60 rounded">
                <span className="absolute -top-5 left-0 font-mono text-[8px] text-emerald-400 bg-black/60 px-1">
                  PERSON 97%
                </span>
              </div>
              <div className="absolute top-1/3 right-1/4 w-24 h-16 border border-blue-400/60 rounded">
                <span className="absolute -top-5 left-0 font-mono text-[8px] text-blue-400 bg-black/60 px-1">
                  VEHICLE 76%
                </span>
              </div>

              {/* Scanline effect */}
              <div className="scanline opacity-30" />
            </div>

            {/* Controls */}
            <div className="mt-4 flex items-center gap-3">
              <button
                onClick={runInference}
                disabled={isProcessing}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all font-mono text-[10px] tracking-[0.2em] uppercase text-white/70 disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isProcessing ? "animate-spin" : ""}`} />
                {isProcessing ? "Processing..." : "Run Inference"}
              </button>
              <div className="px-3 py-2.5 rounded-lg bg-black/40 backdrop-blur-md border border-white/5 font-mono text-[10px] text-white/50">
                FPS: 24
              </div>
            </div>
          </div>

          {/* Cloud Vision JSON Panel */}
          <div className="bento-card rounded-2xl p-6 bento-in" style={{ animationDelay: "90ms" }}>
            <span className="corner tl" />
            <span className="corner tr" />
            <span className="corner bl" />
            <span className="corner br" />

            <div className="flex items-center justify-between mb-4">
              <h2 className="font-mono text-[10px] tracking-[0.28em] uppercase text-white/50">
                Cloud Vision Response
              </h2>
              <Eye className="w-4 h-4 text-white/30" />
            </div>

            {/* JSON output */}
            <div className="bg-black/40 backdrop-blur-md rounded-lg border border-white/5 p-4 font-mono text-[11px] max-h-[400px] overflow-auto">
              <pre className="text-white/70">
{`{
  "responses": [{
    "labelAnnotations": [
${labels.map((l, i) => `      {
        "description": "${l.description}",
        "score": ${l.score.toFixed(4)},
        "topicality": ${l.topicality.toFixed(4)}
      }${i < labels.length - 1 ? "," : ""}`).join("\n")}
    ],
    "safeSearchAnnotation": {
      "adult": "VERY_UNLIKELY",
      "violence": "UNLIKELY"
    }
  }]
}`}
              </pre>
            </div>

            {/* Labels as badges */}
            <div className="mt-4">
              <p className="font-mono text-[9px] tracking-[0.28em] uppercase text-white/40 mb-2">
                Detected Labels
              </p>
              <div className="flex flex-wrap gap-2">
                {labels.map((l) => (
                  <span
                    key={l.description}
                    className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full font-mono text-[10px] ${
                      THREAT_KEYWORDS.some((k) => l.description.toLowerCase().includes(k))
                        ? "bg-red-500/15 border border-red-500/40 text-red-400"
                        : "bg-white/5 backdrop-blur-sm border border-white/10 text-white/60"
                    }`}
                  >
                    {THREAT_KEYWORDS.some((k) => l.description.toLowerCase().includes(k)) ? (
                      <AlertTriangle className="w-3 h-3" />
                    ) : (
                      <Check className="w-3 h-3" />
                    )}
                    {l.description}
                    <span className="text-white/40">{(l.score * 100).toFixed(0)}%</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-white/5 flex items-center justify-between font-mono text-[9px] tracking-[0.28em] uppercase text-white/30">
          <span>Vision Edge Proxy v1.2.0 · Cloud Vision API v1</span>
          <span>Latency: 142ms · Queue: 0</span>
        </footer>
      </main>
    </div>
  );
}


