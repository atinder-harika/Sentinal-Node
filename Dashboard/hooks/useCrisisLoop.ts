"use client";

import { useCallback, useEffect, useRef } from "react";
import { useCrisisStore } from "@/store/useCrisisStore";

interface VisionResult {
  success: boolean;
  threat_detected: boolean;
  threat_type: string;
  confidence: number;
}

interface GemmaResult {
  success: boolean;
  evacuation_message: string;
}

const NODE_LOCATION = "NODE-001";
const SAFE_ZONES = ["North Exit Stairwell"];
const FALLBACK_VOICE_MESSAGE = "Emergency detected. Please evacuate.";

export function useCrisisLoop(opts?: {
  captureFrame?: () => string | null;
  nodeId?: string;
}) {
  const captureFrame = opts?.captureFrame;
  const nodeId = opts?.nodeId ?? "NODE-001";

  const { status, setStatus, setThreat, addToLog, setEvacuationMessage, setAudio } =
    useCrisisStore();

  const autoScanRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inFlightRef = useRef(false);

  const log = useCallback(
    (
      message: string,
      severity: "CRITICAL" | "HIGH" | "WARNING" | "INFO" = "INFO",
      node = nodeId
    ) => addToLog({ message, severity, node }),
    [addToLog, nodeId]
  );

  const triggerNativeVoiceFallback = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.speak(new SpeechSynthesisUtterance(FALLBACK_VOICE_MESSAGE));
    }
  }, []);

  const analyzeFrame = useCallback(
    async (base64Image: string, civilian_transcript?: string) => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;

      try {
        // Step A
        setStatus("ANALYZING");
        log("Analyzing frame with Vision", "INFO");

        const visionResponse = await fetch("/api/vision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image_base64: base64Image }),
        });

        if (!visionResponse.ok) {
          throw new Error(`Vision request failed: ${visionResponse.status}`);
        }

        const vision = (await visionResponse.json()) as VisionResult;
        if (!vision.success) {
          throw new Error("Vision API returned success=false");
        }

        if (!vision.threat_detected) {
          setStatus("IDLE");
          log("No threat detected in current frame", "INFO");
          return;
        }

        // Step B
        setThreat({
          type: vision.threat_type,
          location: NODE_LOCATION,
          confidence: vision.confidence,
        });
        log(`Threat detected: ${vision.threat_type}`, "CRITICAL");

        const gemmaResponse = await fetch("/api/gemma", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            threat_type: vision.threat_type,
            location: NODE_LOCATION,
            safe_zones: SAFE_ZONES,
            civilian_transcript,
          }),
        });

        if (!gemmaResponse.ok) {
          throw new Error(`Gemma request failed: ${gemmaResponse.status}`);
        }

        const gemma = (await gemmaResponse.json()) as GemmaResult;
        if (!gemma.success || !gemma.evacuation_message) {
          throw new Error("Gemma API did not return a valid evacuation message");
        }

        setEvacuationMessage(gemma.evacuation_message);

        // Step C
        const audioResponse = await fetch("/api/audio", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: gemma.evacuation_message }),
        });

        if (!audioResponse.ok) {
          throw new Error(`Audio request failed: ${audioResponse.status}`);
        }

        const audioBlob = await audioResponse.blob();

        // Step D
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        audio.onended = () => URL.revokeObjectURL(audioUrl);
        audio.onerror = () => URL.revokeObjectURL(audioUrl);
        await audio.play();

        setAudio(null);

        // Step E
        setStatus("CRISIS_ACTIVE");
        log(`Evacuation broadcast sent: ${gemma.evacuation_message}`, "HIGH");
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown crisis loop error";
        log(`Crisis loop failure: ${message}`, "WARNING");
        setStatus("IDLE");
        triggerNativeVoiceFallback();
      } finally {
        inFlightRef.current = false;
      }
    },
    [log, setAudio, setEvacuationMessage, setStatus, setThreat, triggerNativeVoiceFallback]
  );

  const analyzeOnce = useCallback(async () => {
    if (!captureFrame) {
      log("Capture frame function unavailable", "WARNING");
      return;
    }

    const frame = captureFrame();
    if (!frame) {
      log("Failed to capture frame", "WARNING");
      return;
    }

    await analyzeFrame(frame);
  }, [analyzeFrame, captureFrame, log]);

  const startAutoScan = useCallback(
    (intervalMs = 5000) => {
      if (autoScanRef.current) return;

      autoScanRef.current = setInterval(() => {
        if (useCrisisStore.getState().status !== "CRISIS_ACTIVE") {
          void analyzeOnce();
        }
      }, intervalMs);

      log(`Auto scan started (${intervalMs}ms)`, "INFO");
    },
    [analyzeOnce, log]
  );

  const stopAutoScan = useCallback(() => {
    if (!autoScanRef.current) return;
    clearInterval(autoScanRef.current);
    autoScanRef.current = null;
    log("Auto scan stopped", "INFO");
  }, [log]);

  useEffect(() => {
    return () => {
      if (autoScanRef.current) {
        clearInterval(autoScanRef.current);
      }
    };
  }, []);

  return {
    status,
    analyzeFrame,
    analyzeOnce,
    startAutoScan,
    stopAutoScan,
    isAutoScanning: () => Boolean(autoScanRef.current),
  };
}
