"use client";

/**
 * ResponderOverride — manual broadcast controls.
 *
 * Calls /api/audio for ElevenLabs TTS, then /api/dispatch to push the audio
 * payload + directive to Node 2. Logs the override into the crisis store and
 * Snowflake. Falls back to speechSynthesis if audio synthesis fails.
 */

import { useState } from "react";
import { toast } from "sonner";
import { BentoCard } from "./bento-card";
import { Button } from "@/components/ui/button";
import { useCrisisStore } from "@/store/useCrisisStore";

export function ResponderOverride() {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const addToLog = useCrisisStore((s) => s.addToLog);

  const handleBroadcast = async () => {
    const text = message.trim();
    if (!text) return;
    setSending(true);
    addToLog({ message: `Manual broadcast: "${text.slice(0, 80)}"`, severity: "HIGH", node: "NODE-001" });

    try {
      const audioRes = await fetch("/api/audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      }).then((r) => r.json());

      // Dispatch to Pi regardless of audio success — Pi can speak via fallback.
      await fetch("/api/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          node_id: "NODE-002",
          location: "Manual Override",
          evacuation_message: text,
          audio_base64: audioRes?.audio_base64,
        }),
      });

      // Log to Snowflake
      fetch("/api/snowflake/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          node_id: "NODE-001",
          event_type: "MANUAL_BROADCAST",
          details: text.slice(0, 240),
        }),
      }).catch(() => {});

      // Local playback
      if (audioRes?.audio_base64) {
        const a = new Audio(`data:${audioRes.mime ?? "audio/mpeg"};base64,${audioRes.audio_base64}`);
        await a.play().catch(() => {});
      } else if (typeof window !== "undefined" && "speechSynthesis" in window) {
        const u = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
      }

      toast.success("Broadcast dispatched", { description: text.slice(0, 60) });
      setMessage("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "broadcast failed";
      toast.error("Broadcast failed", { description: msg });
      addToLog({ message: `Broadcast error: ${msg}`, severity: "WARNING", node: "NODE-001" });
    } finally {
      setSending(false);
    }
  };

  return (
    <BentoCard className="lg:col-span-1" delay={180}>
      <div className="mb-3">
        <h2 className="font-mono text-[10px] tracking-[0.28em] uppercase text-white/50 mb-1">
          Panel 03
        </h2>
        <h3 className="text-base font-semibold text-metal-tint tracking-tight">
          Responder Override
        </h3>
      </div>

      <div className="flex-1 flex flex-col gap-3">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter emergency broadcast..."
          className="flex-1 min-h-[80px] w-full border border-white/10 rounded-lg p-3 font-mono text-[12px] text-white/90 placeholder:text-white/30 resize-none focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,.55), rgba(0,0,0,.35))",
            backdropFilter: "blur(10px) saturate(140%)",
            WebkitBackdropFilter: "blur(10px) saturate(140%)",
            boxShadow:
              "inset 1px 1px 1px 0 rgba(255,255,255,.10), inset -1px -1px 1px 0 rgba(255,255,255,.03)",
          }}
        />

        <Button
          variant="glowing"
          onClick={handleBroadcast}
          disabled={!message.trim() || sending}
          className="w-full py-2.5 rounded-lg font-mono text-[10px] tracking-[0.28em] uppercase transition-all disabled:opacity-50 disabled:cursor-not-allowed text-white hover:scale-[1.03] active:scale-[0.97]"
        >
          {sending ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-3 h-3 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3a9 9 0 1 0 9 9" />
              </svg>
              Broadcasting...
            </span>
          ) : (
            "Broadcast to Nodes"
          )}
        </Button>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() =>
              setMessage("EVACUATE IMMEDIATELY · PROCEED TO NEAREST EXIT")
            }
            className="flex-1 py-1.5 h-auto rounded border border-white/10 bg-white/[.08] backdrop-blur-md font-mono text-[8px] tracking-[0.2em] uppercase text-white/65 hover:bg-white/[.14] hover:text-white/85 transition-all"
          >
            Evacuate
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              setMessage("SHELTER IN PLACE · AWAIT FURTHER INSTRUCTIONS")
            }
            className="flex-1 py-1.5 h-auto rounded border border-white/10 bg-white/[.08] backdrop-blur-md font-mono text-[8px] tracking-[0.2em] uppercase text-white/65 hover:bg-white/[.14] hover:text-white/85 transition-all"
          >
            Shelter
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              setMessage("ALL CLEAR · RESUME NORMAL OPERATIONS")
            }
            className="flex-1 py-1.5 h-auto rounded border border-white/10 bg-white/[.08] backdrop-blur-md font-mono text-[8px] tracking-[0.2em] uppercase text-white/65 hover:bg-white/[.14] hover:text-white/85 transition-all"
          >
            All Clear
          </Button>
        </div>
      </div>
    </BentoCard>
  );
}
