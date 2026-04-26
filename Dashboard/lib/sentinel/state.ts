/**
 * Sentinel Node - server-side mesh state.
 *
 * Holds the latest base64 frame from each Python edge node and the currently
 * active dispatch (threat + ElevenLabs audio). Lives in module-level memory.
 *
 * Why globalThis: Next.js dev mode hot-reloads modules, which would wipe this
 * map every time you save a file. Stashing the singleton on globalThis keeps
 * it alive across hot reloads. In production (Railway, single instance) the
 * module loads once and the map persists for the life of the process.
 */
export interface FrameSnapshot {
  node_id: string;
  image_base64: string;
  captured_at: number;
  threat_detected?: boolean;
  threat_type?: string;
  confidence?: number;
}

export interface DispatchEnvelope {
  event_id: string;
  source_node_id: string;
  threat_type: string;
  confidence: number;
  evacuation_message: string;
  rescue_notes: string;
  audio_base64: string;
  dispatched_at: number;
  consumed_by: string[];
}

interface SentinelState {
  nodeFrames: Map<string, FrameSnapshot>;
  currentDispatch: DispatchEnvelope | null;
  crisisLockUntil: number;
  inFlightSources: Set<string>;
  lastAnalyzedAt: Map<string, number>;
}

declare global {
  // eslint-disable-next-line no-var
  var __sentinelState: SentinelState | undefined;
}

function createInitialState(): SentinelState {
  return {
    nodeFrames: new Map(),
    currentDispatch: null,
    crisisLockUntil: 0,
    inFlightSources: new Set(),
    lastAnalyzedAt: new Map(),
  };
}

const state: SentinelState = globalThis.__sentinelState ?? createInitialState();
if (!globalThis.__sentinelState) {
  globalThis.__sentinelState = state;
}

export function getSentinelState(): SentinelState {
  return state;
}

export function putFrame(snapshot: FrameSnapshot): void {
  state.nodeFrames.set(snapshot.node_id, snapshot);
}

export function getFrame(nodeId: string): FrameSnapshot | undefined {
  return state.nodeFrames.get(nodeId);
}

export function listFrames(): FrameSnapshot[] {
  return Array.from(state.nodeFrames.values());
}

export function getDispatch(): DispatchEnvelope | null {
  return state.currentDispatch;
}

export function setDispatch(env: DispatchEnvelope | null): void {
  state.currentDispatch = env;
}

export function markConsumed(nodeId: string, eventId: string): boolean {
  const d = state.currentDispatch;
  if (!d || d.event_id !== eventId) return false;
  if (!d.consumed_by.includes(nodeId)) {
    d.consumed_by.push(nodeId);
  }
  return true;
}

export function isLocked(now: number = Date.now()): boolean {
  return now < state.crisisLockUntil;
}

export function lockUntil(ms: number): void {
  state.crisisLockUntil = ms;
}

export function isInFlight(sourceNodeId: string): boolean {
  return state.inFlightSources.has(sourceNodeId);
}

export function markInFlight(sourceNodeId: string): void {
  state.inFlightSources.add(sourceNodeId);
}

export function clearInFlight(sourceNodeId: string): void {
  state.inFlightSources.delete(sourceNodeId);
}

export function getLastAnalyzedAt(nodeId: string): number {
  return state.lastAnalyzedAt.get(nodeId) ?? 0;
}

export function setLastAnalyzedAt(nodeId: string, ms: number): void {
  state.lastAnalyzedAt.set(nodeId, ms);
}

export function resetSentinelState(): void {
  state.nodeFrames.clear();
  state.currentDispatch = null;
  state.crisisLockUntil = 0;
  state.inFlightSources.clear();
  state.lastAnalyzedAt.clear();
}
