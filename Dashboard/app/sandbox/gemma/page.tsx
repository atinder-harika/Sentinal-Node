"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";
import { ArrowLeft, BrainCircuit, Send, Terminal, AlertTriangle } from "lucide-react";
import { TopNav } from "@/components/sentinel/top-nav";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: string;
}

const INITIAL_MESSAGES: Message[] = [
  {
    role: "system",
    content: "GEMMA-4 TRIAGE SYSTEM ONLINE. Military-grade threat analysis and evacuation routing active. Awaiting threat report input.",
    timestamp: new Date().toISOString(),
  },
];

const SAMPLE_RESPONSES = [
  `**THREAT ANALYSIS COMPLETE**

Classification: FIRE - SEVERITY HIGH
Confidence: 94.2%

**EVACUATION PROTOCOL INITIATED**

Primary Route: Sector 7G → Emergency Exit B → Assembly Point Alpha
- Distance: 0.4km
- Est. Time: 3 min 20 sec
- Capacity: 200 personnel

Secondary Route: Sector 7G → Stairwell C → Parking Level 2
- Distance: 0.6km  
- Est. Time: 5 min 10 sec
- Capacity: 150 personnel

**NODE ASSIGNMENTS:**
- Node-098: Broadcast evacuation alert (ElevenLabs)
- Node-102: Monitor exit B flow
- Node-105: Guide to Assembly Alpha

**LEDGER:** Transaction logged to Solana devnet.`,
  `**SITUATION ASSESSMENT**

Input processed. No immediate threat detected.

Current Status: MONITORING
- All nodes operational
- No anomalies in sensor data
- Crowd density: NORMAL

Recommendation: Continue standard surveillance protocol.
Next automated scan: 30 seconds.`,
  `**ROUTING CALCULATION**

Based on current threat vectors and crowd density:

OPTIMAL PATH IDENTIFIED:
1. Clear Corridor 3-A (low density)
2. Deploy Node-112 for traffic control
3. Open Emergency Gate 7 (override authorized)

Expected evacuation completion: 8 minutes
Personnel at risk: 0 (if protocol followed)

**WARNING:** Do not use Elevator Bank C - fire suppression active.`,
];

export default function GemmaPage() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;

    const userMessage: Message = {
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsProcessing(true);

    setTimeout(() => {
      const response = SAMPLE_RESPONSES[Math.floor(Math.random() * SAMPLE_RESPONSES.length)];
      const assistantMessage: Message = {
        role: "assistant",
        content: response,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsProcessing(false);
    }, 1500);
  };

  return (
    <div className="app-shell relative min-h-screen w-full bg-tactical overflow-x-hidden">
      <div className="bg-grid" />
      <div className="bg-edge" />
      <div className="grain" />

      <TopNav />

      <main className="app-shell-container relative z-10 px-6 pt-8 pb-24">
        {/* Header */}
        <header className="mb-8 flex flex-col gap-4 border-b border-white/[.08] pb-6">
          <Link
            href="/modules"
            className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors font-mono text-[10px] tracking-[0.28em] uppercase group w-fit"
          >
            <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
            <span>Back to Modules</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 flex items-center justify-center">
              <BrainCircuit className="w-5 h-5 text-white/70" />
            </div>
            <div>
              <h1 className="text-[28px] md:text-[36px] font-bold text-metal-tint tracking-tight">
                Gemma 4 · Triage
              </h1>
              <p className="text-[13px] text-white/50">
                Threat-report in, evacuation routing out. Military-grade terminal chat.
              </p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,.8)]" />
                <span className="font-mono text-[9px] tracking-[0.2em] text-amber-300 uppercase">WARM</span>
              </div>
              <span className="badge-sandbox font-mono text-[9.5px] tracking-[0.28em] uppercase px-3 py-1 rounded-full">
                SANDBOX
              </span>
            </div>
          </div>
        </header>

        {/* Terminal Interface */}
        <div className="bento-card rounded-2xl overflow-hidden bento-in">
          <span className="corner tl" />
          <span className="corner tr" />
          <span className="corner bl" />
          <span className="corner br" />

          {/* Terminal header */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-white/5 bg-black/40 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <Terminal className="w-4 h-4 text-white/40" />
              <span className="font-mono text-[10px] tracking-[0.28em] uppercase text-white/50">
                Gemma-4 Triage Terminal
              </span>
            </div>
            <div className="flex items-center gap-4 font-mono text-[9px] text-white/30">
              <span>Model: gemma-4-27b-triage</span>
              <span>Context: 32k</span>
              <span>Temp: 0.3</span>
            </div>
          </div>

          {/* Messages */}
          <div className="h-[500px] overflow-y-auto p-6 space-y-4 bg-black/20">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
              >
                {msg.role !== "user" && (
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    msg.role === "system" 
                      ? "bg-blue-500/20 border border-blue-500/30" 
                      : "bg-emerald-500/20 border border-emerald-500/30"
                  }`}>
                    {msg.role === "system" ? (
                      <AlertTriangle className="w-4 h-4 text-blue-400" />
                    ) : (
                      <BrainCircuit className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    msg.role === "user"
                      ? "bg-red-500/15 border border-red-500/30"
                      : msg.role === "system"
                        ? "bg-blue-500/10 border border-blue-500/20"
                        : "bg-white/5 backdrop-blur-sm border border-white/10"
                  }`}
                >
                  <div className="font-mono text-[9px] text-white/40 mb-1">
                    {msg.role === "user" ? "OPERATOR" : msg.role === "system" ? "SYSTEM" : "GEMMA-4"} · {new Date(msg.timestamp).toLocaleTimeString()}
                  </div>
                  <div className="text-[13px] text-white/80 whitespace-pre-wrap font-mono leading-relaxed">
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
            {isProcessing && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <BrainCircuit className="w-4 h-4 text-emerald-400 animate-pulse" />
                </div>
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" style={{ animationDelay: "0.2s" }} />
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" style={{ animationDelay: "0.4s" }} />
                    <span className="font-mono text-[10px] text-white/40 ml-2">Processing threat analysis...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={handleSubmit} className="p-4 border-t border-white/5 bg-black/40 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Enter threat report or query..."
                  className="w-full bg-black/40 backdrop-blur-md border border-white/10 rounded-lg px-4 py-3 font-mono text-[13px] text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20"
                />
              </div>
              <Button
                variant="glowing"
                type="submit"
                disabled={isProcessing || !input.trim()}
                className="px-6 py-3 rounded-lg text-white hover:scale-[1.03] active:scale-[0.97] transition-all font-mono text-[10px] tracking-[0.2em] uppercase flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                Submit
              </Button>
            </div>
            <div className="mt-3 flex items-center gap-4">
              <button
                type="button"
                onClick={() => setInput("Fire detected in Sector 7G. Smoke visible. 12 personnel in area.")}
                className="text-[10px] font-mono text-white/40 hover:text-white/60 transition-colors"
              >
                [Sample: Fire Report]
              </button>
              <button
                type="button"
                onClick={() => setInput("Calculate optimal evacuation route for Building A, Level 3.")}
                className="text-[10px] font-mono text-white/40 hover:text-white/60 transition-colors"
              >
                [Sample: Route Query]
              </button>
              <button
                type="button"
                onClick={() => setInput("Status check: all nodes.")}
                className="text-[10px] font-mono text-white/40 hover:text-white/60 transition-colors"
              >
                [Sample: Status Check]
              </button>
            </div>
          </form>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-white/5 flex items-center justify-between font-mono text-[9px] tracking-[0.28em] uppercase text-white/30">
          <span>Gemma-4 Triage v2.1.0 · Context: 32,768 tokens</span>
          <span>Inference: ~1.2s · GPU: A100-80GB</span>
        </footer>
      </main>
    </div>
  );
}


