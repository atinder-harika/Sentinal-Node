"use client";

import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { TopNav } from "@/components/sentinel/top-nav";
import {
  ShieldAlert,
  Camera,
  BrainCircuit,
  Radio,
  Database,
  ArrowRight,
} from "lucide-react";

const MODULES = [
  {
    key: "dashboard",
    title: "Sentinel Dashboard",
    badge: "DEPLOYMENT",
    icon: ShieldAlert,
    desc: "The primary operational UI. Live threat tracking, centralized mesh map, and automated evacuation routing.",
    route: "/dashboard",
    status: "ACTIVE",
    stats: [
      { k: "NODES", v: "142", tone: "green" },
      { k: "ALERTS 24H", v: "03", tone: "amber" },
      { k: "ACTIVE", v: "0", tone: "green" },
      { k: "UPTIME", v: "99.98", tone: "white" },
    ],
    heartbeat: "node-098 heartbeat OK",
    span: "lg:col-span-4 lg:row-span-2",
    deploy: true,
  },
  {
    key: "vision",
    title: "Vision · Edge Proxy",
    badge: "SANDBOX",
    icon: Camera,
    desc: "Mocked webcam feed → Cloud Vision JSON. Inspect labels the edge proxy emits.",
    route: "/sandbox/vision",
    status: "STBY",
    span: "lg:col-span-2 lg:row-span-1",
  },
  {
    key: "gemma",
    title: "Gemma 4 · Triage",
    badge: "SANDBOX",
    icon: BrainCircuit,
    desc: "Threat-report in, evacuation routing out. Military-grade terminal chat.",
    route: "/sandbox/gemma",
    status: "WARM",
    span: "lg:col-span-2 lg:row-span-1",
  },
  {
    key: "comms",
    title: "ElevenLabs · Broadcast",
    badge: "SANDBOX",
    icon: Radio,
    desc: "Type a message, generate a localized voice stream, play on the node speakers.",
    route: "/sandbox/audio",
    status: "STBY",
    span: "lg:col-span-3 lg:row-span-1",
  },
  {
    key: "audit",
    title: "Data · Compute · Ledger",
    badge: "SANDBOX",
    icon: Database,
    desc: "Snowflake alert table, DCP distributed compute, Solana devnet tamper-proof log.",
    route: "/sandbox/data",
    status: "SYNC",
    span: "lg:col-span-3 lg:row-span-1",
  },
];

function Heartbeat() {
  const [time, setTime] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`;
  });

  useEffect(() => {
    const id = setInterval(() => {
      const d = new Date();
      setTime(
        `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(d.getSeconds()).padStart(2, "0")}`
      );
    }, 1000);
    return () => clearInterval(id);
  }, []);

  return <span>{time}</span>;
}

function BentoCard({
  mod,
  index,
}: {
  mod: (typeof MODULES)[0];
  index: number;
}) {
  const ref = useRef<HTMLAnchorElement>(null);

  const onMove = (e: React.MouseEvent) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
    el.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
  };

  const Icn = mod.icon;

  return (
    <Link
      href={mod.route}
      ref={ref}
      onMouseMove={onMove}
      className={`group liquid-glass-card bento-in p-6 flex flex-col justify-between cursor-pointer ${mod.deploy ? "card-deploy" : ""} ${mod.span}`}
      style={{ animationDelay: `${index * 90}ms` }}
    >
      <span className="corner tl" />
      <span className="corner tr" />
      <span className="corner bl" />
      <span className="corner br" />

      {/* Head */}
      <div className="flex items-start gap-4">
        <div className={`icon-plate shrink-0 ${mod.deploy ? "icon-plate-deploy" : ""}`}>
          <Icn
            className={`w-6 h-6 ${mod.deploy ? "text-red-300" : "text-white/80"}`}
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3
              className={`font-semibold text-white tracking-tight ${mod.deploy ? "text-[22px] md:text-[26px]" : "text-[15.5px]"}`}
            >
              {mod.title}
            </h3>
            <span
              className={`ml-auto font-mono text-[9.5px] tracking-[0.28em] uppercase px-2 py-0.5 rounded-full ${mod.badge === "DEPLOYMENT" ? "badge-deploy" : "badge-sandbox"}`}
            >
              {mod.badge}
            </span>
          </div>
          <p
            className={`mt-2 text-white/60 leading-[1.55] ${mod.deploy ? "text-[14px] max-w-[52ch]" : "text-[12.5px]"}`}
          >
            {mod.desc}
          </p>
        </div>
      </div>

      {/* Middle: stats + heartbeat for deploy card */}
      {mod.deploy && mod.stats && (
        <>
          <div className="mt-6 grid grid-cols-4 gap-px rounded-lg overflow-hidden border border-white/5 bg-white/5 backdrop-blur-sm">
            {mod.stats.map((s) => (
              <div key={s.k} className="bg-zinc-950/70 backdrop-blur-xl px-4 py-3">
                <div className="font-mono text-[9.5px] tracking-[0.28em] text-white/40 uppercase">
                  {s.k}
                </div>
                <div
                  className={`font-mono text-[26px] leading-tight mt-1 ${
                    s.tone === "green"
                      ? "text-emerald-400"
                      : s.tone === "amber"
                        ? "text-amber-300"
                        : "text-white"
                  }`}
                >
                  {s.v}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 px-3 py-2.5 rounded-md border border-white/[.08] bg-black/40 backdrop-blur-md font-mono text-[11.5px] text-white/70 flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(16,185,129,.8)] blink" />
              <span className="text-emerald-400 tracking-[0.2em]">LIVE</span>
            </span>
            <span className="text-white/50">
              <Heartbeat />
            </span>
            <span className="text-white/85">{mod.heartbeat}</span>
          </div>
        </>
      )}

      {/* Foot */}
      <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-between font-mono text-[10px] tracking-[0.24em] text-white/45 uppercase">
        <span className="text-white/55">{mod.route}</span>
        <ArrowRight className="w-3.5 h-3.5 text-white/40 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

export default function ModulesPage() {
  return (
    <div className="app-shell relative min-h-screen w-full bg-tactical overflow-x-hidden">
      <div className="bg-grid" />
      <div className="bg-edge" />
      <div className="grain" />

      <TopNav />

      <main className="app-shell-container relative z-10 px-6 pt-12 pb-24">
        {/* Page header */}
        <header className="mb-10 flex flex-col gap-6 border-b border-white/[.08] pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="font-mono text-[10px] tracking-[0.32em] text-white/40 uppercase">
                /MODULES · COMMAND HUB
              </span>
              <span className="h-3 w-px bg-white/20" />
              <span className="inline-flex items-center gap-1.5">
                <span className="w-[6px] h-[6px] rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,.7)]" />
                <span className="font-mono text-[10px] tracking-[0.28em] text-emerald-400 uppercase">
                  Online
                </span>
              </span>
            </div>
            <h1 className="text-[36px] md:text-[48px] font-extrabold text-metal-tint tracking-tight leading-none">
              Sentinel Modules
            </h1>
          </div>

          <div className="text-right max-w-sm">
            <p className="text-[13px] text-white/50 leading-relaxed">
              A modular array of Sentinel Node subsystems. Select an active
              deployment or initialize a sandbox environment.
            </p>
          </div>
        </header>

        {/* Bento grid */}
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 auto-rows-auto">
          {MODULES.map((mod, i) => (
            <BentoCard key={mod.key} mod={mod} index={i} />
          ))}
        </div>

        {/* Footer telemetry */}
        <footer className="mt-16 pt-6 border-t border-white/5 flex items-center justify-between font-mono text-[9px] tracking-[0.28em] uppercase text-white/30">
          <div className="flex items-center gap-6">
            <span>Sentinel Node v0.4.1-alpha</span>
            <span className="h-3 w-px bg-white/10" />
            <span>Build 26.04.24</span>
          </div>
          <div className="flex items-center gap-6">
            <span>TLS 1.3 · mTLS · HSM 0x9F…A1</span>
            <span className="h-3 w-px bg-white/10" />
            <span>LAT 7ms</span>
          </div>
        </footer>
      </main>
    </div>
  );
}


