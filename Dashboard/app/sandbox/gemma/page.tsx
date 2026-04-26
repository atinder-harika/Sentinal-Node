"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { ArrowLeft, BrainCircuit, MapPin, ShieldAlert } from "lucide-react";
import { TopNav } from "@/components/sentinel/top-nav";

interface GemmaResponse {
  success: boolean;
  evacuation_message: string;
  rescue_notes: string;
}

export default function GemmaPage() {
  const [threatType, setThreatType] = useState("Active Shooter");
  const [location, setLocation] = useState("Main Hallway");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<GemmaResponse | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!threatType.trim() || !location.trim()) {
      setError("Threat Type and Location are required.");
      return;
    }

    setIsLoading(true);
    setError("");
    setResult(null);

    try {
      const response = await fetch("/api/gemma", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          threat_type: threatType.trim(),
          location: location.trim(),
          safe_zones: ["North Exit Stairwell"],
        }),
      });

      const data = (await response.json()) as GemmaResponse;
      if (!response.ok || !data.success) {
        throw new Error("Gemma API request failed.");
      }

      setResult(data);
    } catch (submitError) {
      const message = submitError instanceof Error ? submitError.message : "Unexpected error";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app-shell relative min-h-screen w-full bg-tactical overflow-x-hidden">
      <div className="bg-grid" />
      <div className="bg-edge" />
      <div className="grain" />

      <TopNav />

      <main className="app-shell-container relative z-10 px-6 pt-8 pb-24">
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
                Gemma LLM Sandbox
              </h1>
              <p className="text-[13px] text-white/50">
                Submit threat context and inspect the generated evacuation route and rescue notes.
              </p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <section className="bento-card rounded-2xl p-6 bento-in">
            <span className="corner tl" />
            <span className="corner tr" />
            <span className="corner bl" />
            <span className="corner br" />

            <h2 className="font-mono text-[10px] tracking-[0.28em] uppercase text-white/50 mb-5">
              Threat Input
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="threat-type"
                  className="block font-mono text-[10px] tracking-[0.2em] uppercase text-white/50 mb-2"
                >
                  Threat Type
                </label>
                <input
                  id="threat-type"
                  type="text"
                  value={threatType}
                  onChange={(e) => setThreatType(e.target.value)}
                  placeholder="Active Shooter"
                  className="w-full bg-black/40 backdrop-blur-md border border-white/10 rounded-lg px-4 py-3 font-mono text-[13px] text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20"
                />
              </div>

              <div>
                <label
                  htmlFor="location"
                  className="block font-mono text-[10px] tracking-[0.2em] uppercase text-white/50 mb-2"
                >
                  Location
                </label>
                <input
                  id="location"
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Main Hallway"
                  className="w-full bg-black/40 backdrop-blur-md border border-white/10 rounded-lg px-4 py-3 font-mono text-[13px] text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/50 focus:ring-1 focus:ring-red-500/20"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-3 font-mono text-[10px] tracking-[0.2em] uppercase text-white/80 hover:bg-white/10 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <ShieldAlert className="w-4 h-4" />
                {isLoading ? "Generating..." : "Generate Response"}
              </button>
            </form>

            {error ? (
              <div className="mt-4 rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-[12px] text-red-300">
                {error}
              </div>
            ) : null}
          </section>

          <section className="bento-card rounded-2xl p-6 bento-in">
            <span className="corner tl" />
            <span className="corner tr" />
            <span className="corner bl" />
            <span className="corner br" />

            <h2 className="font-mono text-[10px] tracking-[0.28em] uppercase text-white/50 mb-5">
              LLM Output
            </h2>

            <div className="space-y-4">
              <div className="rounded-lg border border-white/10 bg-black/40 p-4">
                <div className="mb-2 inline-flex items-center gap-2 text-emerald-300">
                  <MapPin className="w-4 h-4" />
                  <span className="font-mono text-[10px] tracking-[0.2em] uppercase">
                    Evacuation Route
                  </span>
                </div>
                <p className="text-[14px] text-white/85 leading-relaxed min-h-10">
                  {result?.evacuation_message ?? "Waiting for model response..."}
                </p>
              </div>

              <div className="rounded-lg border border-white/10 bg-black/40 p-4">
                <div className="mb-2 inline-flex items-center gap-2 text-amber-300">
                  <ShieldAlert className="w-4 h-4" />
                  <span className="font-mono text-[10px] tracking-[0.2em] uppercase">
                    Rescue Notes
                  </span>
                </div>
                <p className="text-[14px] text-white/85 leading-relaxed min-h-10">
                  {result?.rescue_notes ?? "Waiting for model response..."}
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
