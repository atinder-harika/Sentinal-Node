"use client";

/**
 * MeshSync — invisible client component that polls the server's mesh state
 * (`GET /api/node/frame`) on a fixed cadence and pushes the result into
 * useCrisisStore. This is what re-arms the NodeGrid pulse + arrow animations
 * now that the crisis loop runs server-side instead of inside the browser.
 *
 * Mount once at the top of the dashboard page; renders nothing.
 */

import { useEffect, useRef } from "react";
import { useCrisisStore, type MeshCrisis } from "@/store/useCrisisStore";

const POLL_MS = 1500;

interface MeshSnapshotResponse {
  success: boolean;
  crisis: MeshCrisis | null;
}

export function MeshSync() {
  const lastEventIdRef = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setInterval> | null = null;

    const tick = async () => {
      try {
        const r = await fetch("/api/node/frame", { cache: "no-store" });
        if (!r.ok) return;
        const j = (await r.json()) as MeshSnapshotResponse;
        if (cancelled) return;

        const store = useCrisisStore.getState();
        store.applyMeshCrisis(j.crisis);

        if (j.crisis) {
          if (lastEventIdRef.current !== j.crisis.event_id) {
            lastEventIdRef.current = j.crisis.event_id;
            store.addToLog({
              message: `${j.crisis.threat_type} detected · ${(j.crisis.confidence * 100).toFixed(0)}%`,
              severity: "CRITICAL",
              node: j.crisis.source_node_id,
            });
            if (j.crisis.evacuation_message) {
              store.addToLog({
                message: `Evacuation: ${j.crisis.evacuation_message}`,
                severity: "HIGH",
                node: j.crisis.source_node_id,
              });
            }
            if (
              j.crisis.rescue_notes &&
              j.crisis.rescue_notes.toLowerCase() !== "no casualties identified."
            ) {
              store.addToLog({
                message: `Rescue notes: ${j.crisis.rescue_notes}`,
                severity: "HIGH",
                node: j.crisis.source_node_id,
              });
            }
          }
        } else {
          // Crisis cleared — reset the dedupe ref so a future event re-logs.
          lastEventIdRef.current = null;
        }
      } catch {
        // Silent — transient fetch errors are expected during deploys.
      }
    };

    void tick();
    timer = setInterval(() => void tick(), POLL_MS);

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
    };
  }, []);

  return null;
}
