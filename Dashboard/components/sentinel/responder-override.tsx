"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BentoCard } from "./bento-card";
import { Button } from "@/components/ui/button";
import { useCrisisStore } from "@/store/useCrisisStore";

interface DispatchSnapshot {
  crisis_lock_until: number;
  crisis: { event_id: string } | null;
}

export function ResponderOverride() {
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [lockUntil, setLockUntilState] = useState<number>(0);
  const [now, setNow] = useState<number>(() => Date.now());
  const addToLog = useCrisisStore((s) => s.addToLog);
  const crisis = useCrisisStore((s) => s.crisis);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const tick = async () => {
      try {
        const r = await fetch("/api/node/frame", { cache: "no-store" });
        if (!r.ok) return;
        const j = (await r.json()) as DispatchSnapshot;
        if (cancelled) return;
        setLockUntilState(j.crisis_lock_until ?? 0);
      } catch {
        // ignore
      }
    };
    void tick();
    const id = setInterval(() => void tick(), 2000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const lockRemainingMs = Math.max(0, lockUntil - now);
  const locked = lockRemainingMs > 0;

  const handleBroadcast = async () => {
    const text = message.trim();
    if (!text) return;
    setSending(true);
    addToLog({
      message: 'Manual broadcast: "' + text.slice(0, 80) + '"',
      severity: "HIGH",
      node: "OPERATOR",
    });

    try {
      const r = await fetch("/api/node/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          evacuation_message: text,
          source_node_id: "OPERATOR",
          threat_type: "Manual Override",
        }),
      });
      const j = (await r.json()) as { success: boolean; error?: string };

      if (!r.ok || !j.success) {
        throw new Error(j.error ?? "dispatch failed (" + r.status + ")");
      }

      toast.success("Broadcast dispatched", {
        description: text.slice(0, 60),
      });
      setMessage("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "broadcast failed";
      addToLog({
        message: "Broadcast error: " + msg,
        severity: "WARNING",
        node: "OPERATOR",
      });

      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        const u = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
        toast.error("Server dispatch failed - using browser speech fallback", {
          description: msg,
        });
      } else {
        toast.error("Broadcast failed", { description: msg });
      }
    } finally {
      setSending(false);
    }
  };

  const handleReset = async () => {
    setResetting(true);
    try {
      const r = await fetch("/api/node/frame", { method: "DELETE" });
      if (!r.ok) throw new Error("reset failed (" + r.status + ")");
      addToLog({
        message: "Crisis cleared by operator. Vision resumed.",
        severity: "INFO",
        node: "OPERATOR",
      });
      toast.success("Crisis reset", {
        description: "Lock cleared. Vision will resume on the next frame.",
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "reset failed";
      toast.error("Reset failed", { description: msg });
    } finally {
      setResetting(false);
    }
  };

  return (
    <BentoCard className="lg:col-span-1" delay={180}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <h2 className="font-mono text-[10px] tracking-[0.28em] uppercase text-white/50 mb-1">
            Panel 03
          </h2>
          <h3 className="text-base font-semibold text-metal-tint tracking-tight">
            Responder Override
          </h3>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={
              "font-mono text-[8px] tracking-[0.28em] uppercase " +
              (locked ? "text-amber-300" : "text-emerald-400")
            }
          >
            {locked ? "Vision Paused" : "Vision Active"}
          </span>
          {locked && (
            <span className="font-mono text-[10px] text-amber-200">
              {Math.ceil(lockRemainingMs / 1000)}s
            </span>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col gap-3">
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Enter emergency broadcast..."
          className="flex-1 min-h-[80px] w-full border border-white/10 rounded-lg p-3 font-mono text-[12px] text-white/90 placeholder:text-white/30 resize-none focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20 transition-all"
          style={{
            background: "linear-gradient(180deg, rgba(0,0,0,.55), rgba(0,0,0,.35))",
            backdropFilter: "blur(10px) saturate(140%)",
            WebkitBackdropFilter: "blur(10px) saturate(140%)",
            boxShadow: "inset 1px 1px 1px 0 rgba(255,255,255,.10), inset -1px -1px 1px 0 rgba(255,255,255,.03)",
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
            onClick={() => setMessage("EVACUATE IMMEDIATELY - PROCEED TO NEAREST EXIT")}
            className="flex-1 py-1.5 h-auto rounded border border-white/10 bg-white/[.08] backdrop-blur-md font-mono text-[8px] tracking-[0.2em] uppercase text-white/65 hover:bg-white/[.14] hover:text-white/85 transition-all"
          >
            Evacuate
          </Button>
          <Button
            variant="outline"
            onClick={() => setMessage("SHELTER IN PLACE - AWAIT FURTHER INSTRUCTIONS")}
            className="flex-1 py-1.5 h-auto rounded border border-white/10 bg-white/[.08] backdrop-blur-md font-mono text-[8px] tracking-[0.2em] uppercase text-white/65 hover:bg-white/[.14] hover:text-white/85 transition-all"
          >
            Shelter
          </Button>
          <Button
            variant="outline"
            onClick={() => setMessage("ALL CLEAR - RESUME NORMAL OPERATIONS")}
            className="flex-1 py-1.5 h-auto rounded border border-white/10 bg-white/[.08] backdrop-blur-md font-mono text-[8px] tracking-[0.2em] uppercase text-white/65 hover:bg-white/[.14] hover:text-white/85 transition-all"
          >
            All Clear
          </Button>
        </div>

        <Button
          variant="outline"
          onClick={handleReset}
          disabled={resetting || (!locked && !crisis)}
          className="w-full py-1.5 h-auto rounded border border-amber-400/30 bg-amber-400/10 font-mono text-[9px] tracking-[0.28em] uppercase text-amber-200 hover:bg-amber-400/20 hover:border-amber-400/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {resetting ? "Resetting..." : "Reset Crisis Lock"}
        </Button>
      </div>
    </BentoCard>
  );
}
