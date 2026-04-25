"use client";

/**
 * useCrisisLoop — PRD §5
 *
 * Client-side orchestration for the Sentinel "Crisis Loop":
 *   capture frame → /api/vision → /api/snowflake/log → /api/gemma →
 *   /api/audio → /api/snowflake/log → /api/dispatch → playback.
 *
 * Every fetch is wrapped in try/catch with the fallbacks specified in
 * PRD §5: Vision Failure aborts + toasts; Gemma Failure uses a hardcoded
 * directive; Audio Failure triggers window.speechSynthesis.
 */

import { useCallback, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useCrisisStore } from "@/store/useCrisisStore";

interface VisionResult {
  success: boolean;
  threat_detected: boolean;
  threat_type: string | null;
  confidence: number;
  raw_labels: string[];
  source: string;
  error?: string;
}

interface GemmaResult {
  success: boolean;
  evacuation_message: string;
  source: string;
  error?: string;
}

interface AudioResult {
  success: boolean;
  audio_base64?: string;
  mime?: string;
  source: string;
  error?: string;
}

const FALLBACK_DIRECTIVE =
  "Emergency detected. Please evacuate the area immediately and proceed to the North Exit stairwell.";

export function useCrisisLoop(opts?: {
  /** Captures the current webcam frame as a base64 data URL. Required to actually run. */
  captureFrame?: () => string | null;
  /** Active node id; defaults to NODE-001. */
  nodeId?: string;
  /** Active node label; defaults to "Main Hall". */
  location?: string;
}) {
  const captureFrame = opts?.captureFrame;
  const nodeId = opts?.nodeId ?? "NODE-001";
  const location = opts?.location ?? "Main Hall";

  const setStatus = useCrisisStore((s) => s.setStatus);
  const setThreat = useCrisisStore((s) => s.setThreat);
  const addToLog = useCrisisStore((s) => s.addToLog);
  const setEvacuationMessage = useCrisisStore((s) => s.setEvacuationMessage);
  const setAudio = useCrisisStore((s) => s.setAudio);

  const audioElRef = useRef<HTMLAudioElement | null>(null);
  const autoScanRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inFlightRef = useRef(false);

  // ────────────── helpers ──────────────
  const log = useCallback(
    (
      message: string,
      severity: "CRITICAL" | "HIGH" | "WARNING" | "INFO" = "INFO",
      node = nodeId
    ) => addToLog({ message, severity, node }),
    [addToLog, nodeId]
  );

  const playAudio = useCallback(
    async (b64?: string, mime = "audio/mpeg", text?: string) => {
      try {
        if (b64) {
          const url = `data:${mime};base64,${b64}`;
          if (!audioElRef.current) audioElRef.current = new Audio();
          audioElRef.current.src = url;
          await audioElRef.current.play();
          return;
        }
        throw new Error("no audio buffer");
      } catch {
        // Fallback: native speech synthesis
        if (typeof window !== "undefined" && "speechSynthesis" in window && text) {
          const utter = new SpeechSynthesisUtterance(text);
          utter.rate = 1.05;
          utter.pitch = 1;
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(utter);
        }
      }
    },
    []
  );

  // ────────────── single analyze pass ──────────────
  const analyzeOnce = useCallback(async () => {
    if (inFlightRef.current) return;
    if (!captureFrame) {
      toast.error("Webcam not ready");
      return;
    }
    const frame = captureFrame();
    if (!frame) {
      toast.error("Failed to capture frame");
      return;
    }

    inFlightRef.current = true;
    setStatus("ANALYZING");
    log("Frame captured — sending to Vision pipeline", "INFO");

    // 1) Vision check
    let vision: VisionResult;
    try {
      const res = await fetch("/api/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image_base64: frame }),
      });
      vision = (await res.json()) as VisionResult;
      if (!vision.success) throw new Error(vision.error ?? "vision failure");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Vision API Timeout";
      toast.error("Vision API Timeout", { description: msg });
      log(`Vision pipeline failed: ${msg}`, "WARNING");
      setStatus("IDLE");
      inFlightRef.current = false;
      return;
    }

    if (!vision.threat_detected) {
      log(
        `Frame clear — top labels: ${vision.raw_labels.slice(0, 3).join(", ") || "none"}`,
        "INFO"
      );
      setStatus("IDLE");
      inFlightRef.current = false;
      return;
    }

    // 2) Threat confirmed → set state, log to Snowflake
    const threat = {
      type: vision.threat_type ?? "Unknown",
      location,
      confidence: vision.confidence,
      rawLabels: vision.raw_labels,
    };
    setThreat(threat);
    setStatus("CRISIS_ACTIVE");
    const conf = `${Math.round(vision.confidence * 100)}%`;
    log(`THREAT_DETECTED · ${threat.type} · ${conf}`, "CRITICAL");

    fetch("/api/snowflake/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        node_id: nodeId,
        event_type: "THREAT_DETECTED",
        details: `${threat.type} ${conf}`,
      }),
    }).catch((e) => log(`Snowflake log failed: ${e?.message ?? e}`, "WARNING"));

    // 3) Gemma triage
    let directive = FALLBACK_DIRECTIVE;
    try {
      const res = await fetch("/api/gemma", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threat_type: threat.type, location }),
      });
      const gemma = (await res.json()) as GemmaResult;
      if (gemma?.evacuation_message) directive = gemma.evacuation_message;
      log(`Gemma routing (${gemma.source}): "${directive}"`, "HIGH");
    } catch (e) {
      log(`Gemma fallback used: ${e instanceof Error ? e.message : e}`, "WARNING");
    }
    setEvacuationMessage(directive);

    // 4) ElevenLabs audio
    let audio: AudioResult | null = null;
    try {
      const res = await fetch("/api/audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: directive }),
      });
      audio = (await res.json()) as AudioResult;
      if (audio.success && audio.audio_base64) {
        setAudio(audio.audio_base64);
        log("ElevenLabs audio ready · broadcasting", "HIGH");
      } else {
        throw new Error(audio.error ?? "no audio");
      }
    } catch (e) {
      log(
        `Audio fallback to speechSynthesis: ${e instanceof Error ? e.message : e}`,
        "WARNING"
      );
    }

    // 5) Snowflake — final action log
    fetch("/api/snowflake/log", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        node_id: nodeId,
        event_type: "EVACUATION_DISPATCHED",
        details: directive.slice(0, 240),
      }),
    }).catch(() => {});

    // 6) Dispatch payload to Node 2 (Pi)
    fetch("/api/dispatch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        threat_type: threat.type,
        location,
        evacuation_message: directive,
        audio_base64: audio?.audio_base64,
        node_id: "NODE-002",
      }),
    })
      .then(async (r) => {
        const j = await r.json();
        log(
          j.dispatched
            ? "Node 2 dispatched · LEDs / buzzer / speaker armed"
            : "Node 2 dispatch mocked (no NODE2_PUSH_URL)",
          "HIGH",
          "NODE-002"
        );
      })
      .catch((e) => log(`Dispatch error: ${e?.message ?? e}`, "WARNING", "NODE-002"));

    // 7) Browser broadcast
    await playAudio(audio?.audio_base64, audio?.mime, directive);

    inFlightRef.current = false;
  }, [
    captureFrame,
    location,
    log,
    nodeId,
    playAudio,
    setAudio,
    setEvacuationMessage,
    setStatus,
    setThreat,
  ]);

  // ────────────── auto-scan controls ──────────────
  const startAutoScan = useCallback(
    (intervalMs = 5000) => {
      if (autoScanRef.current) return;
      autoScanRef.current = setInterval(() => {
        // Read the freshest status from the store rather than a stale closure.
        if (useCrisisStore.getState().status !== "CRISIS_ACTIVE") analyzeOnce();
      }, intervalMs);
      log(`Auto-scan engaged · ${intervalMs}ms interval`, "INFO");
    },
    [analyzeOnce, log]
  );

  const stopAutoScan = useCallback(() => {
    if (autoScanRef.current) {
      clearInterval(autoScanRef.current);
      autoScanRef.current = null;
      log("Auto-scan disengaged", "INFO");
    }
  }, [log]);

  useEffect(() => {
    return () => {
      if (autoScanRef.current) clearInterval(autoScanRef.current);
    };
  }, []);

  return {
    analyzeOnce,
    startAutoScan,
    stopAutoScan,
    isAutoScanning: () => Boolean(autoScanRef.current),
  };
}
