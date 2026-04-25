import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TopNav } from "@/components/sentinel/top-nav";
import { NodeGrid } from "@/components/sentinel/node-grid";
import { LiveFeed } from "@/components/sentinel/live-feed";
import { ResponderOverride } from "@/components/sentinel/responder-override";
import { IncidentLog } from "@/components/sentinel/incident-log";

export default function DashboardPage() {
  return (
    <div className="app-shell relative min-h-screen w-full bg-tactical overflow-x-hidden">
      {/* Background layers */}
      <div className="bg-grid" />
      <div className="bg-edge" />

      {/* Grain overlay */}
      <div className="grain" />

      {/* Top Navigation - exact from Modules.html */}
      <TopNav />

      {/* Main content */}
      <main className="app-shell-container relative z-10 px-6 pt-8 pb-24">
        {/* Page header */}
        <header className="mb-8 flex flex-col gap-4 border-b border-white/[.08] pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <Link 
              href="/modules" 
              className="inline-flex items-center gap-2 text-white/50 hover:text-white transition-colors font-mono text-[10px] tracking-[0.28em] uppercase mb-3 group"
            >
              <ArrowLeft className="w-3.5 h-3.5 transition-transform group-hover:-translate-x-0.5" />
              <span>Back to Modules</span>
            </Link>
            <h1 className="text-[28px] md:text-[36px] font-bold text-metal-tint tracking-tight">
              Sentinel Dashboard
            </h1>
            <p className="mt-2 text-[14px] text-white/50 max-w-xl">
              Centralized threat intelligence and automated evacuation routing across Edge Node mesh.
            </p>
          </div>
          <div className="flex items-center gap-4 font-mono text-[10px] tracking-[0.28em] uppercase text-white/40">
            <span>Session: SN-26-0424-9F</span>
            <span className="h-3 w-px bg-white/10" />
            <span>Operator: CLR-L3</span>
          </div>
        </header>

        {/* Bento grid layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 auto-rows-auto">
          {/* Panel 1: Node Grid (spans 2 cols, 2 rows) */}
          <NodeGrid />

          {/* Panel 2: Live Feed */}
          <LiveFeed />

          {/* Panel 3: Responder Override */}
          <ResponderOverride />

          {/* Panel 4: Incident Log (spans full width) */}
          <IncidentLog />
        </div>

        {/* Footer telemetry */}
        <footer className="mt-12 pt-6 border-t border-white/5 flex items-center justify-between font-mono text-[9px] tracking-[0.28em] uppercase text-white/30">
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
