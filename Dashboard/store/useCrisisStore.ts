"use client";

import { create } from "zustand";

export type CrisisStatus = "IDLE" | "ANALYZING" | "CRISIS_ACTIVE";

export interface ThreatData {
  type: string;
  location: string;
  confidence: number;
  rawLabels?: string[];
}

export interface ActionLogEntry {
  timestamp: string;
  message: string;
  node?: string;
  severity?: "CRITICAL" | "HIGH" | "WARNING" | "INFO";
}

export interface MeshCrisis {
  event_id: string;
  source_node_id: string;
  threat_type: string;
  confidence: number;
  evacuation_message: string;
  rescue_notes: string;
  dispatched_at: number;
}

export interface CrisisState {
  status: CrisisStatus;
  threatData: ThreatData | null;
  actionLog: ActionLogEntry[];
  activeNode: string;
  selectedNodeId: string;
  crisis: MeshCrisis | null;
  evacuationMessage: string | null;
  audioBase64: string | null;

  setStatus: (s: CrisisStatus) => void;
  setThreat: (t: ThreatData | null) => void;
  addToLog: (entry: Omit<ActionLogEntry, "timestamp"> & { timestamp?: string }) => void;
  setEvacuationMessage: (m: string | null) => void;
  setAudio: (b64: string | null) => void;
  setSelectedNode: (id: string) => void;
  applyMeshCrisis: (crisis: MeshCrisis | null) => void;
  resetCrisis: () => void;
}

export const useCrisisStore = create<CrisisState>((set) => ({
  status: "IDLE",
  threatData: null,
  actionLog: [],
  activeNode: "NODE-001 (Main Hall)",
  selectedNodeId: "NODE-001",
  crisis: null,
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
      ].slice(0, 200),
    })),
  setEvacuationMessage: (m) => set({ evacuationMessage: m }),
  setAudio: (b64) => set({ audioBase64: b64 }),
  setSelectedNode: (id) => set({ selectedNodeId: id }),
  applyMeshCrisis: (crisis) =>
    set(() => {
      if (!crisis) {
        return {
          crisis: null,
          status: "IDLE" as const,
          threatData: null,
          evacuationMessage: null,
        };
      }
      return {
        crisis,
        status: "CRISIS_ACTIVE" as const,
        threatData: {
          type: crisis.threat_type,
          location: crisis.source_node_id,
          confidence: crisis.confidence,
        },
        evacuationMessage: crisis.evacuation_message,
      };
    }),
  resetCrisis: () =>
    set({
      status: "IDLE",
      threatData: null,
      crisis: null,
      evacuationMessage: null,
      audioBase64: null,
    }),
}));

export const MESH_NODES = [
  { id: "NODE-001", label: "Main Hall", role: "DETECTION" as const },
  { id: "NODE-002", label: "Adjacent Hallway", role: "ACTION" as const },
  { id: "NODE-003", label: "North Exit", role: "SAFE" as const },
  { id: "NODE-004", label: "South Exit", role: "STANDBY" as const },
] as const;

export type MeshNode = typeof MESH_NODES[number];
