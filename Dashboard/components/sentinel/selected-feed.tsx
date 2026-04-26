"use client";

/**
 * SelectedFeed — single camera viewer that swaps based on which mesh node
 * the operator clicks in the NodeGrid. Polls /api/node/frame?node_id=<id>
 * every ~1.5 s and renders the latest base64 JPEG uploaded by the
 * corresponding Python edge node. No browser camera access — all frames
 * come from the server, so this works fine in production behind Auth0.
 */

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { BentoCard } from "./bento-card";
import {
  useCrisisStore,
  MESH_NODES,
  type MeshNode,
} from "@/store/useCrisisStore";

const POLL_MS = 1500;

interface FrameSnapshot {
  node_id: string;
  image_base64: string;
  captured_at: number;
  threat_detected?: boolean;
  threat_type?: string;
  confidence?: number;
}

interface FrameResponse {
  success: boolean;
  frame?: FrameSnapshot;
  error?: string;
}

function findMeshNode(nodeId: string): MeshNode | undefined {
  return MESH_NODES.find((n) => n.id === nodeId);
}

export function SelectedFeed() {
  const selectedNodeId = useCrisisStore((s) => s.selectedNodeId);
  const meshNode = findMeshNode(selectedNodeId);
  const label = meshNode?.label ?? "Unknown";

  const crisis = useCrisisStore((s) => s.crisis);
  const isCrisisOnSelected =
    crisis !== null && crisis.source_node_id === selectedNodeId;

  const [frame, setFrame] = useState<FrameSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [timestamp, setTimestamp] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Local clock tick.
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

  // Frame poller — restarts whenever the selected node changes.
  useEffect(() => {
    let cancelled = false;
    setFrame(null);
    setError(null);

    const fetchFrame = async () => {
      try {
        const r = await fetch(
          `/api/node/frame?node_id=${encodeURIComponent(selectedNodeId)}`,
          { cache: "no-store" }
        );
        if (cancelled) return;
        if (r.status === 404) {
          setFrame(null);
          setError(null);
          return;
        }
        if (!r.ok) {
          setError(`HTTP ${r.status}`);
          return;
        }
        const j = (await r.json()) as FrameResponse;
        if (cancelled) return;
        if (j.success && j.frame) {
          setFrame(j.frame);
          setError(null);
        } else {
          setError(j.error ?? "no frame");
        }
      } catch (e) {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "fetch error");
      }
    };

    void fetchFrame();
    intervalRef.current = setInterval(() => void fetchFrame(), POLL_MS);

    return () => {
      cancelled = true;
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = null;
    };
  }, [selectedNodeId]);

  const ageMs = frame ? Date.now() - frame.captured_at : Infinity;
  const isStale = ageMs > 8000;
  const isOffline = !frame;

  const statusLabel = isOffline
    ? "OFFLINE"
    : isStale
      ? "STALE"
      : isCrisisOnSelected
        ? "CRISIS"
        : "LIVE";

  const statusBadgeClasses = isOffline
    ? "border-white/10 bg-white/[.04] text-white/40"
    : isStale
      ? "border-amber-400/30 bg-amber-400/10 text-amber-300"
      : isCrisisOnSelected
        ? "border-red-500/40 bg-red-500/10 text-red-400"
        : "border-emerald-500/30 bg-emerald-500/5 text-emerald-400";

  const frameSrc = frame
    ? `data:image/jpeg;base64,${frame.image_base64}`
    : null;

  return (
    <BentoCard className="lg:col-span-1" delay={90}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <h2 className="font-mono text-[10px] tracking-[0.28em] uppercase text-white/50 mb-1">
            Panel 02 · Camera Viewer
          </h2>
          <h3 className="text-base font-semibold text-metal-tint tracking-tight">
            {selectedNodeId} · {label}
          </h3>
          <p className="mt-0.5 font-mono text-[9px] tracking-[0.2em] uppercase text-white/40">
            Click any node in Panel 01 to swap
          </p>
        </div>
        <div
          className={cn(
            "flex items-center gap-2 px-2 py-1 rounded border self-start",
            statusBadgeClasses
          )}
        >
          <span
            className={cn(
              "dot",
              isCrisisOnSelected ? "red blink" : ""
            )}
          />
          <span className="font-mono text-[9px] tracking-[0.2em] uppercase">
            {statusLabel}
          </span>
        </div>
      </div>

      <div
        className={cn(
          "flex-1 relative bg-black/50 rounded-lg overflow-hidden min-h-[180px] transition-all",
          isCrisisOnSelected
            ? "border-2 border-red-500/70 shadow-[0_0_24px_rgba(239,68,68,.45)] animate-pulse"
            : isOffline
              ? "border border-white/10"
              : "border border-emerald-500/30 shadow-[0_0_12px_rgba(16,185,129,.18)]"
        )}
      >
        {frameSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={frameSrc}
            alt={`${selectedNodeId} live feed`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
            <span className="font-mono text-[10px] tracking-[0.28em] uppercase text-white/40 mb-2">
              Awaiting node.py
            </span>
            <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-white/30">
              {error ?? `No frames received from ${selectedNodeId} yet.`}
            </span>
          </div>
        )}

        {isCrisisOnSelected && crisis && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-500/5 border-2 border-red-500/40 pointer-events-none">
            <div className="px-4 py-2 rounded border border-red-500/60 bg-red-500/20 backdrop-blur-sm">
              <span className="font-mono text-[11px] tracking-[0.28em] uppercase text-red-400 animate-pulse">
                {crisis.threat_type} · {Math.round(crisis.confidence * 100)}%
              </span>
            </div>
          </div>
        )}

        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between pointer-events-none">
          <span className="font-mono text-[9px] tracking-[0.2em] text-white/70 bg-black/60 px-2 py-0.5 rounded">
            {selectedNodeId} · {label}
          </span>
          <span className="font-mono text-[9px] tracking-[0.2em] text-white/70 bg-black/60 px-2 py-0.5 rounded">
            {timestamp}
          </span>
        </div>

        <div
          className={cn(
            "absolute top-2 left-2 w-4 h-4 border-l border-t",
            isCrisisOnSelected ? "border-red-500/70" : "border-emerald-500/40"
          )}
        />
        <div
          className={cn(
            "absolute top-2 right-2 w-4 h-4 border-r border-t",
            isCrisisOnSelected ? "border-red-500/70" : "border-emerald-500/40"
          )}
        />
        <div
          className={cn(
            "absolute bottom-8 left-2 w-4 h-4 border-l border-b",
            isCrisisOnSelected ? "border-red-500/70" : "border-emerald-500/40"
          )}
        />
        <div
          className={cn(
            "absolute bottom-8 right-2 w-4 h-4 border-r border-b",
            isCrisisOnSelected ? "border-red-500/70" : "border-emerald-500/40"
          )}
        />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2 text-center">
        <div className="py-2 rounded border border-white/10 bg-white/[.04]">
          <div className="font-mono text-[8px] tracking-[0.28em] uppercase text-white/40">
            Frame Age
          </div>
          <div className="font-mono text-[11px] text-white/80 mt-0.5">
            {frame ? `${Math.max(0, Math.round(ageMs / 1000))}s` : "—"}
          </div>
        </div>
        <div className="py-2 rounded border border-white/10 bg-white/[.04]">
          <div className="font-mono text-[8px] tracking-[0.28em] uppercase text-white/40">
            Last Verdict
          </div>
          <div
            className={cn(
              "font-mono text-[11px] mt-0.5 truncate px-2",
              isCrisisOnSelected ? "text-red-300" : "text-white/70"
            )}
          >
            {frame?.threat_detected && frame.threat_type
              ? frame.threat_type
              : frame?.threat_detected === false
                ? "Clear"
                : "—"}
          </div>
        </div>
      </div>
    </BentoCard>
  );
}
