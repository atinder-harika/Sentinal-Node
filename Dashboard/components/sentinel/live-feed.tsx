"use client";

/**
 * LiveFeed — PRD §4.3 Panel 1 ("Edge Node Feed")
 *
 * Hosts the actual webcam, exposes Start Auto-Scan / Manual Override Scan
 * controls, and renders a glowing border that turns from green to pulsing red
 * when the Crisis Loop flips status to CRISIS_ACTIVE.
 */

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { BentoCard } from "./bento-card";
import { WebcamFeed, type WebcamHandle } from "./webcam-feed";
import { useCrisisLoop } from "@/hooks/useCrisisLoop";
import { useCrisisStore } from "@/store/useCrisisStore";

export function LiveFeed() {
  const camRef = useRef<WebcamHandle | null>(null);
  const [autoOn, setAutoOn] = useState(false);
  const [timestamp, setTimestamp] = useState("");

  const status = useCrisisStore((s) => s.status);
  const threat = useCrisisStore((s) => s.threatData);

  const { analyzeOnce, startAutoScan, stopAutoScan } = useCrisisLoop({
    captureFrame: () => camRef.current?.captureFrame() ?? null,
  });

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setTimestamp(
        `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(
          d.getSeconds()
        ).padStart(2, "0")}`
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const isCrisis = status === "CRISIS_ACTIVE";
  const isAnalyzing = status === "ANALYZING";

  const toggleAuto = () => {
    if (autoOn) {
      stopAutoScan();
      setAutoOn(false);
    } else {
      startAutoScan(5000);
      setAutoOn(true);
    }
  };

  return (
    <BentoCard className="lg:col-span-1" delay={90}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-mono text-[10px] tracking-[0.28em] uppercase text-white/50 mb-1">
            Panel 02
          </h2>
          <h3 className="text-base font-semibold text-metal-tint tracking-tight">
            Edge Node Feed · NODE-001
          </h3>
        </div>
        <div
          className={cn(
            "flex items-center gap-2 px-2 py-1 rounded border",
            isCrisis
              ? "border-red-500/40 bg-red-500/10"
              : isAnalyzing
              ? "border-amber-400/30 bg-amber-400/10"
              : "border-emerald-500/30 bg-emerald-500/5"
          )}
        >
          <span className={cn("dot", isCrisis ? "red blink" : "")} />
          <span
            className={cn(
              "font-mono text-[9px] tracking-[0.2em] uppercase",
              isCrisis ? "text-red-400" : isAnalyzing ? "text-amber-300" : "text-emerald-400"
            )}
          >
            {isCrisis ? "CRISIS" : isAnalyzing ? "SCANNING" : "LIVE"}
          </span>
        </div>
      </div>

      <div
        className={cn(
          "flex-1 relative bg-black/50 rounded-lg overflow-hidden min-h-[180px] transition-all",
          isCrisis
            ? "border-2 border-red-500/70 shadow-[0_0_24px_rgba(239,68,68,.45)] animate-pulse"
            : "border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,.18)]"
        )}
      >
        <WebcamFeed ref={camRef} mirrored />

        {isCrisis && threat && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-500/5 border-2 border-red-500/40 pointer-events-none">
            <div className="px-4 py-2 rounded border border-red-500/60 bg-red-500/20 backdrop-blur-sm">
              <span className="font-mono text-[11px] tracking-[0.28em] uppercase text-red-400 animate-pulse">
                {threat.type} · {Math.round(threat.confidence * 100)}%
              </span>
            </div>
          </div>
        )}

        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
          <span className="font-mono text-[9px] tracking-[0.2em] text-white/70 bg-black/60 px-2 py-0.5 rounded">
            CAM-01 · MAIN HALL
          </span>
          <span className="font-mono text-[9px] tracking-[0.2em] text-white/70 bg-black/60 px-2 py-0.5 rounded">
            {timestamp}
          </span>
        </div>

        <div className={cn("absolute top-2 left-2 w-4 h-4 border-l border-t", isCrisis ? "border-red-500/70" : "border-emerald-500/40")} />
        <div className={cn("absolute top-2 right-2 w-4 h-4 border-r border-t", isCrisis ? "border-red-500/70" : "border-emerald-500/40")} />
        <div className={cn("absolute bottom-8 left-2 w-4 h-4 border-l border-b", isCrisis ? "border-red-500/70" : "border-emerald-500/40")} />
        <div className={cn("absolute bottom-8 right-2 w-4 h-4 border-r border-b", isCrisis ? "border-red-500/70" : "border-emerald-500/40")} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={toggleAuto}
          disabled={isAnalyzing}
          className={cn(
            "py-2 rounded border font-mono text-[9px] tracking-[0.28em] uppercase transition-colors",
            autoOn
              ? "border-amber-400/40 bg-amber-400/10 text-amber-200 hover:bg-amber-400/20"
              : "border-white/10 bg-white/[.08] backdrop-blur-md text-white/80 hover:bg-white/[.14]",
            isAnalyzing && "opacity-50 cursor-not-allowed"
          )}
        >
          {autoOn ? "Stop Auto-Scan" : "Start Auto-Scan"}
        </button>
        <button
          type="button"
          onClick={analyzeOnce}
          disabled={isAnalyzing}
          className="py-2 rounded border border-red-500/40 bg-red-500/10 text-red-200 hover:bg-red-500/20 font-mono text-[9px] tracking-[0.28em] uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isAnalyzing ? "Analyzing…" : "Manual Override"}
        </button>
      </div>
    </BentoCard>
  );
}
