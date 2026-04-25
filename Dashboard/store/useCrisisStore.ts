"use client";

/**
 * Sentinel Node — Crisis Store (PRD §4.2)
 * Global state management via Zustand. The single source of truth that the
 * dashboard, NodeGrid, IncidentLog, LiveFeed, TopNav DEFCON, and the
 * useCrisisLoop orchestration hook all subscribe to.
 */

import { create } from "zustand";

export type CrisisStatus = "IDLE" | "ANALYZING" | "CRISIS_ACTIVE";

export interface ThreatData {
  type: string;          // e.g. "Fire", "Weapon", "Smoke"
  location: string;      // e.g. "Main Hall"
  confidence: number;    // 0..1
  rawLabels?: string[];
}

export interface ActionLogEntry {
  timestamp: string;     // ISO 8601 string for stable serialization
  message: string;
  node?: string;         // optional node id (e.g. "NODE-001")
  severity?: "CRITICAL" | "HIGH" | "WARNING" | "INFO";
}

export interface CrisisState {
  status: CrisisStatus;
  threatData: ThreatData | null;
  actionLog: ActionLogEntry[];
  activeNode: string;
  evacuationMessage: string | null;
  audioBase64: string | null;

  // Actions
  setStatus: (s: CrisisStatus) => void;
  setThreat: (t: ThreatData | null) => void;
  addToLog: (entry: Omit<ActionLogEntry, "timestamp"> & { timestamp?: string }) => void;
  setEvacuationMessage: (m: string | null) => void;
  setAudio: (b64: string | null) => void;
  resetCrisis: () => void;
}

export const useCrisisStore = create<CrisisState>((set) => ({
  status: "IDLE",
  threatData: null,
  actionLog: [],
  activeNode: "NODE-001 (Main Hall)",
  evacuationMessage: null,
  audioBase64: null,

  setStatus: (s) => set({ status: s }),
  setThreat: (t) => set({ threatData: t }),
  addToLog: (entry) =>
    set((state) => ({
      actionLog: [
        {
          timestamp: entry.timestamp ?? new Date().toISOString(),
          message: entry.message,
          node: entry.node,
          severity: entry.severity ?? "INFO",
        },
        ...state.actionLog,
      ].slice(0, 200), // cap to last 200 events
    })),
  setEvacuationMessage: (m) => set({ evacuationMessage: m }),
  setAudio: (b64) => set({ audioBase64: b64 }),
  resetCrisis: () =>
    set({
      status: "IDLE",
      threatData: null,
      evacuationMessage: null,
      audioBase64: null,
    }),
}));

/**
 * The 4-node mesh per PRD §9 demo workflow.
 * Node 1 is the Detection node (laptop webcam).
 * Node 3 is the designated safe sector / North Exit.
 */
export const MESH_NODES = [
  { id: "NODE-001", label: "Main Hall", role: "DETECTION" as const },
  { id: "NODE-002", label: "Adjacent Hallway", role: "ACTION" as const },
  { id: "NODE-003", label: "North Exit", role: "SAFE" as const },
  { id: "NODE-004", label: "South Exit", role: "STANDBY" as const },
] as const;

export type MeshNode = typeof MESH_NODES[number];
