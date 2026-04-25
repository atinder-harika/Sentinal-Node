"use client";

/**
 * NodeGrid — PRD §4.3 Panel 2 ("Tactical Mesh Map")
 *
 * Four-node mesh from MESH_NODES. When status === CRISIS_ACTIVE:
 *   - Node 1 (Detection / Main Hall) flashes red
 *   - An animated arrow draws from Node 1 to Node 3 (North Exit / Safe)
 */

import { cn } from "@/lib/utils";
import { BentoCard } from "./bento-card";
import { useCrisisStore, MESH_NODES } from "@/store/useCrisisStore";

export function NodeGrid() {
  const status = useCrisisStore((s) => s.status);
  const isCrisis = status === "CRISIS_ACTIVE";

  return (
    <BentoCard className="lg:col-span-2 lg:row-span-2" delay={0}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-mono text-[10px] tracking-[0.28em] uppercase text-white/50 mb-1">
            Panel 01
          </h2>
          <h3 className="text-lg font-semibold text-metal-tint tracking-tight">
            Tactical Mesh Map
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("dot", isCrisis ? "red blink" : "")} />
          <span
            className={cn(
              "font-mono text-[10px] tracking-[0.28em] uppercase",
              isCrisis ? "text-red-400" : "text-emerald-400"
            )}
          >
            {isCrisis ? "Threat Active" : "All Nominal"}
          </span>
        </div>
      </div>

      <div className="flex-1 relative bg-black/30 rounded-lg border border-white/5 p-6 overflow-hidden">
        <div className="scanline opacity-30" />
        <div
          className="absolute inset-0 pointer-events-none opacity-20"
          style={{
            backgroundImage: `
              linear-gradient(to right, rgba(255,255,255,.1) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(255,255,255,.1) 1px, transparent 1px)
            `,
            backgroundSize: "24px 24px",
          }}
        />

        {/* SVG arrow layer (renders only on crisis) */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <defs>
            <marker
              id="evac-arrow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M0,0 L10,5 L0,10 Z" fill="rgb(16,185,129)" />
            </marker>
          </defs>
          {isCrisis && (
            <line
              x1="25"
              y1="30"
              x2="75"
              y2="70"
              stroke="rgb(16,185,129)"
              strokeWidth="0.6"
              strokeDasharray="2 2"
              markerEnd="url(#evac-arrow)"
              style={{
                animation: "evac-flow 1.4s linear infinite",
              }}
            />
          )}
        </svg>

        {/* 2x2 node layout */}
        <div className="relative z-10 grid grid-cols-2 gap-6 h-full">
          {MESH_NODES.map((node) => {
            const isDetection = node.role === "DETECTION";
            const isSafe = node.role === "SAFE";
            const showThreat = isCrisis && isDetection;
            const showSafe = isCrisis && isSafe;

            return (
              <div
                key={node.id}
                className={cn(
                  "relative flex flex-col items-center justify-center rounded-lg border p-4 transition-all min-h-[120px]",
                  showThreat
                    ? "threat-pulse bg-red-500/10 border-red-500/60"
                    : showSafe
                    ? "bg-emerald-500/15 border-emerald-500/60 shadow-[0_0_24px_rgba(16,185,129,.35)]"
                    : node.role === "STANDBY"
                    ? "bg-amber-500/5 border-amber-500/20"
                    : "bg-white/[.06] backdrop-blur-md border-white/10 hover:border-emerald-500/30 hover:bg-emerald-500/10"
                )}
              >
                <span
                  className={cn(
                    "font-mono text-[22px] font-bold leading-none",
                    showThreat
                      ? "text-red-400"
                      : showSafe
                      ? "text-emerald-300"
                      : node.role === "STANDBY"
                      ? "text-amber-400/60"
                      : "text-white/80"
                  )}
                >
                  {node.id.replace("NODE-", "")}
                </span>
                <span
                  className={cn(
                    "mt-1 font-mono text-[9px] tracking-[0.2em] uppercase",
                    showThreat
                      ? "text-red-400/80"
                      : showSafe
                      ? "text-emerald-300/80"
                      : "text-white/50"
                  )}
                >
                  {node.label}
                </span>

                <div className="flex items-center gap-1.5 mt-3">
                  <span
                    className={cn(
                      "w-1.5 h-1.5 rounded-full",
                      showThreat
                        ? "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,.8)] blink"
                        : showSafe
                        ? "bg-emerald-300 shadow-[0_0_8px_rgba(16,185,129,.9)]"
                        : node.role === "STANDBY"
                        ? "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,.6)]"
                        : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,.8)]"
                    )}
                  />
                  <span
                    className={cn(
                      "font-mono text-[8px] tracking-[0.2em] uppercase",
                      showThreat
                        ? "text-red-400"
                        : showSafe
                        ? "text-emerald-300"
                        : node.role === "STANDBY"
                        ? "text-amber-400/60"
                        : "text-white/40"
                    )}
                  >
                    {showThreat
                      ? "ALERT"
                      : showSafe
                      ? "EVAC ROUTE"
                      : node.role === "STANDBY"
                      ? "STBY"
                      : "OK"}
                  </span>
                </div>

                {showThreat && (
                  <div className="absolute inset-0 rounded-lg bg-red-500/10 animate-pulse" />
                )}
              </div>
            );
          })}
        </div>

        <div className="absolute bottom-3 left-3 flex items-center gap-4 font-mono text-[9px] tracking-[0.2em] uppercase text-white/40">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Nominal
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Standby
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            Threat
          </span>
        </div>
      </div>
    </BentoCard>
  );
}
