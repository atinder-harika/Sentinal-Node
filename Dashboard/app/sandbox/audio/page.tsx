"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Radio, Play, Pause, Volume2, Send, Mic } from "lucide-react";
import { TopNav } from "@/components/sentinel/top-nav";

const VOICE_PRESETS = [
  { id: "emergency-male", name: "Emergency Male", lang: "en-US" },
  { id: "emergency-female", name: "Emergency Female", lang: "en-US" },
  { id: "calm-authority", name: "Calm Authority", lang: "en-US" },
  { id: "multilingual", name: "Multilingual", lang: "multi" },
];

const LANGUAGES = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "zh", name: "Mandarin" },
  { code: "hi", name: "Hindi" },
  { code: "ar", name: "Arabic" },
];

const QUICK_MESSAGES = [
  "Evacuate immediately. Proceed to the nearest exit.",
  "Shelter in place. Do not leave the building.",
  "All clear. Normal operations may resume.",
  "Medical emergency. First responders en route.",
];

const WAVE_BAR_HEIGHTS = [
  "h-[24%]",
  "h-[38%]",
  "h-[52%]",
  "h-[31%]",
  "h-[47%]",
  "h-[60%]",
  "h-[27%]",
  "h-[44%]",
];

export default function AudioPage() {
  const [message, setMessage] = useState("");
  const [selectedVoice, setSelectedVoice] = useState(VOICE_PRESETS[0].id);
  const [selectedLang, setSelectedLang] = useState("en");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState(false);
  const [volume, setVolume] = useState(80);
  const [targetNodes, setTargetNodes] = useState<string[]>(["all"]);
  const [audioSrc, setAudioSrc] = useState<string>("");
  const [error, setError] = useState("");
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const previousObjectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = volume / 100;
  }, [volume]);

  useEffect(() => {
    return () => {
      if (previousObjectUrlRef.current) {
        URL.revokeObjectURL(previousObjectUrlRef.current);
      }
    };
  }, []);

  const handleGenerate = async () => {
    if (!message.trim()) return;

    setError("");
    setIsGenerating(true);

    try {
      const response = await fetch("/api/audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: message.trim() }),
      });

      if (!response.ok) {
        throw new Error(`Audio generation failed (${response.status})`);
      }

      let nextSrc = "";
      const contentType = response.headers.get("content-type") ?? "";

      if (contentType.includes("audio/")) {
        const blob = await response.blob();
        nextSrc = URL.createObjectURL(blob);
        if (previousObjectUrlRef.current) {
          URL.revokeObjectURL(previousObjectUrlRef.current);
        }
        previousObjectUrlRef.current = nextSrc;
      } else {
        const json = (await response.json()) as { audio_base64?: string; mime?: string };
        if (!json.audio_base64) {
          throw new Error("Audio response did not include playable audio data");
        }
        nextSrc = `data:${json.mime ?? "audio/mpeg"};base64,${json.audio_base64}`;
      }

      setAudioSrc(nextSrc);
      setGeneratedAudio(true);
      setIsPlaying(false);

      setTimeout(async () => {
        if (!audioRef.current) return;
        try {
          await audioRef.current.play();
          setIsPlaying(true);
        } catch {
          setError("Autoplay was blocked. Press play to listen.");
        }
      }, 0);
    } catch (err) {
      const messageText = err instanceof Error ? err.message : "Unexpected audio generation error";
      setError(messageText);
      setGeneratedAudio(false);
      setAudioSrc("");
      setIsPlaying(false);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleBroadcast = async () => {
    if (!audioRef.current || !audioSrc) return;
    setError("");

    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch {
      setError("Playback failed. Try generating audio again.");
      setIsPlaying(false);
    }
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
              <Radio className="w-5 h-5 text-white/70" />
            </div>
            <div>
              <h1 className="text-[28px] md:text-[36px] font-bold text-metal-tint tracking-tight">
                ElevenLabs · Broadcast
              </h1>
              <p className="text-[13px] text-white/50">
                Type a message, generate a localized voice stream, play on the node speakers.
              </p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,.8)]" />
                <span className="font-mono text-[9px] tracking-[0.2em] text-amber-300 uppercase">RATE-LIMITED</span>
              </div>
              <span className="badge-sandbox font-mono text-[9.5px] tracking-[0.28em] uppercase px-3 py-1 rounded-full">
                SANDBOX
              </span>
            </div>
          </div>
        </header>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Message Composer */}
          <div className="lg:col-span-2 bento-card rounded-2xl p-6 bento-in">
            <span className="corner tl" />
            <span className="corner tr" />
            <span className="corner bl" />
            <span className="corner br" />

            <h2 className="font-mono text-[10px] tracking-[0.28em] uppercase text-white/50 mb-4">
              Message Composer
            </h2>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your broadcast message..."
              className="w-full h-40 bg-black/40 backdrop-blur-md border border-white/10 rounded-lg px-4 py-3 font-mono text-[14px] text-white placeholder:text-white/30 focus:outline-none focus:border-red-500/50 resize-none"
            />

            {/* Quick messages */}
            <div className="mt-4">
              <p className="font-mono text-[9px] tracking-[0.28em] uppercase text-white/40 mb-2">
                Quick Messages
              </p>
              <div className="flex flex-wrap gap-2">
                {QUICK_MESSAGES.map((msg, i) => (
                  <button
                    key={i}
                    onClick={() => setMessage(msg)}
                    className="px-3 py-1.5 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 font-mono text-[10px] text-white/60 hover:bg-white/10 hover:text-white transition-all"
                  >
                    {msg.slice(0, 30)}...
                  </button>
                ))}
              </div>
            </div>

            {/* Voice settings */}
            <div className="mt-6 grid grid-cols-2 gap-4">
              <div>
                <label className="font-mono text-[9px] tracking-[0.28em] uppercase text-white/40 mb-2 block">
                  Voice Preset
                </label>
                <select
                  value={selectedVoice}
                  onChange={(e) => setSelectedVoice(e.target.value)}
                  title="Voice Preset"
                  aria-label="Voice Preset"
                  className="w-full bg-black/40 backdrop-blur-md border border-white/10 rounded-lg px-4 py-2.5 font-mono text-[12px] text-white focus:outline-none focus:border-red-500/50"
                >
                  {VOICE_PRESETS.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-mono text-[9px] tracking-[0.28em] uppercase text-white/40 mb-2 block">
                  Language
                </label>
                <select
                  value={selectedLang}
                  onChange={(e) => setSelectedLang(e.target.value)}
                  title="Language"
                  aria-label="Language"
                  className="w-full bg-black/40 backdrop-blur-md border border-white/10 rounded-lg px-4 py-2.5 font-mono text-[12px] text-white focus:outline-none focus:border-red-500/50"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Generate button */}
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !message.trim()}
              className="mt-6 w-full py-3 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all font-mono text-[11px] tracking-[0.2em] uppercase text-white/70 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Mic className={`w-4 h-4 ${isGenerating ? "animate-pulse" : ""}`} />
              {isGenerating ? "Generating Audio..." : "Generate Voice"}
            </button>

            {error ? (
              <p className="mt-3 text-[12px] text-red-300 font-mono">{error}</p>
            ) : null}
          </div>

          {/* Broadcast Controls */}
          <div className="bento-card rounded-2xl p-6 bento-in">
            <span className="corner tl" />
            <span className="corner tr" />
            <span className="corner bl" />
            <span className="corner br" />

            <h2 className="font-mono text-[10px] tracking-[0.28em] uppercase text-white/50 mb-4">
              Broadcast Controls
            </h2>

            {/* Audio preview */}
            <div className="bg-black/40 backdrop-blur-md rounded-lg border border-white/10 p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-mono text-[10px] text-white/50">Audio Preview</span>
                {generatedAudio && (
                  <span className="font-mono text-[9px] text-emerald-400">Ready</span>
                )}
              </div>
              
              {/* Waveform visualization */}
              <div className="h-16 flex items-center justify-center gap-1">
                {Array.from({ length: 32 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-1 rounded-full transition-all ${
                      isPlaying
                        ? "bg-red-400 animate-pulse"
                        : generatedAudio
                          ? "bg-white/30"
                          : "bg-white/10"
                    } ${WAVE_BAR_HEIGHTS[i % WAVE_BAR_HEIGHTS.length]}`}
                  />
                ))}
              </div>

              {/* Playback controls */}
              <div className="flex items-center gap-3 mt-4">
                <audio
                  ref={audioRef}
                  src={audioSrc}
                  preload="auto"
                  onEnded={() => setIsPlaying(false)}
                  onPause={() => setIsPlaying(false)}
                  onPlay={() => setIsPlaying(true)}
                />
                <button
                  onClick={handleBroadcast}
                  disabled={!generatedAudio}
                  className="w-10 h-10 rounded-full bg-red-500/20 border border-red-500/40 flex items-center justify-center text-red-300 hover:bg-red-500/30 transition-all disabled:opacity-50"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                </button>
                <div className="flex-1">
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full bg-red-500 transition-all ${isPlaying ? "animate-pulse w-3/5" : "w-0"}`}
                    />
                  </div>
                </div>
                <span className="font-mono text-[10px] text-white/40">0:03</span>
              </div>
            </div>

            {/* Volume */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[9px] tracking-[0.28em] uppercase text-white/40">
                  Volume
                </span>
                <span className="font-mono text-[10px] text-white/60">{volume}%</span>
              </div>
              <div className="flex items-center gap-3">
                <Volume2 className="w-4 h-4 text-white/40" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  title="Volume"
                  aria-label="Volume"
                  className="flex-1 h-1 bg-white/10 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-red-500"
                />
              </div>
            </div>

            {/* Target nodes */}
            <div className="mb-4">
              <span className="font-mono text-[9px] tracking-[0.28em] uppercase text-white/40 mb-2 block">
                Target Nodes
              </span>
              <div className="flex flex-wrap gap-2">
                {["all", "sector-7G", "node-098", "node-102"].map((node) => (
                  <button
                    key={node}
                    onClick={() => setTargetNodes([node])}
                    className={`px-3 py-1.5 rounded-full font-mono text-[10px] transition-all ${
                      targetNodes.includes(node)
                        ? "bg-red-500/20 border border-red-500/40 text-red-300"
                        : "bg-white/5 backdrop-blur-sm border border-white/10 text-white/50"
                    }`}
                  >
                    {node}
                  </button>
                ))}
              </div>
            </div>

            {/* Broadcast button */}
            <Button
              variant="glowing"
              onClick={handleBroadcast}
              disabled={!generatedAudio || isPlaying}
              className="w-full py-3 rounded-lg text-white hover:scale-[1.03] active:scale-[0.97] transition-all font-mono text-[11px] tracking-[0.2em] uppercase flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
              Broadcast to Nodes
            </Button>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-white/5 flex items-center justify-between font-mono text-[9px] tracking-[0.28em] uppercase text-white/30">
          <span>ElevenLabs API v1 · Voice Cloning Disabled</span>
          <span>Rate Limit: 42/100 · Resets in 18:32</span>
        </footer>
      </main>
    </div>
  );
}


