import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { TopNav } from "@/components/sentinel/top-nav";
import { NodeGrid } from "@/components/sentinel/node-grid";
import { SelectedFeed } from "@/components/sentinel/selected-feed";
import { ResponderOverride } from "@/components/sentinel/responder-override";
import { IncidentLog } from "@/components/sentinel/incident-log";
import { MeshSync } from "@/components/sentinel/mesh-sync";

export default function DashboardPage() {
  return (
    <div className="app-shell relative min-h-screen w-full bg-tactical overflow-x-hidden">
      <div className="bg-grid" />
      <div className="bg-edge" />
      <div className="grain" />

      <TopNav />

      <main className="app-shell-container relative z-10 px-6 pt-8 pb-24">
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

        <MeshSync />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 auto-rows-auto">
          <NodeGrid />
          <SelectedFeed />
          <ResponderOverride />
          <IncidentLog />
        </div>

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
