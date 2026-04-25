"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, Database, Snowflake, Server, Link2, RefreshCw, ExternalLink } from "lucide-react";
import { TopNav } from "@/components/sentinel/top-nav";

const SNOWFLAKE_ALERTS = [
  { id: "ALT-9001", timestamp: "2024-04-26T14:32:18Z", type: "FIRE", severity: "HIGH", node: "node-098", status: "RESOLVED" },
  { id: "ALT-9000", timestamp: "2024-04-26T12:15:42Z", type: "CROWD", severity: "MEDIUM", node: "node-102", status: "ACTIVE" },
  { id: "ALT-8999", timestamp: "2024-04-26T09:08:11Z", type: "SYSTEM", severity: "LOW", node: "node-105", status: "RESOLVED" },
  { id: "ALT-8998", timestamp: "2024-04-25T22:45:33Z", type: "FIRE", severity: "CRITICAL", node: "node-098", status: "RESOLVED" },
  { id: "ALT-8997", timestamp: "2024-04-25T18:22:07Z", type: "EVACUATION", severity: "HIGH", node: "node-112", status: "RESOLVED" },
];

const SOLANA_LOGS = [
  { signature: "5xK9...mR2q", slot: 289456123, type: "ALERT_LOG", status: "confirmed", fee: 0.000005 },
  { signature: "3nP7...xL4s", slot: 289456089, type: "NODE_HEARTBEAT", status: "confirmed", fee: 0.000005 },
  { signature: "8vM2...pQ7w", slot: 289455998, type: "ROUTE_CALC", status: "confirmed", fee: 0.000005 },
  { signature: "2kJ5...nT9r", slot: 289455876, type: "ALERT_LOG", status: "finalized", fee: 0.000005 },
  { signature: "9xR3...mK6p", slot: 289455654, type: "BROADCAST", status: "finalized", fee: 0.000005 },
];

const DCP_TASKS = [
  { id: "DCP-001", type: "Route Optimization", workers: 24, progress: 100, status: "COMPLETE" },
  { id: "DCP-002", type: "Crowd Density Analysis", workers: 18, progress: 67, status: "RUNNING" },
  { id: "DCP-003", type: "Sensor Fusion", workers: 32, progress: 45, status: "RUNNING" },
  { id: "DCP-004", type: "Model Inference", workers: 8, progress: 0, status: "QUEUED" },
];

export default function DataPage() {
  const [activeTab, setActiveTab] = useState<"snowflake" | "dcp" | "solana">("snowflake");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1000);
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
              <Database className="w-5 h-5 text-white/70" />
            </div>
            <div>
              <h1 className="text-[28px] md:text-[36px] font-bold text-metal-tint tracking-tight">
                Data · Compute · Ledger
              </h1>
              <p className="text-[13px] text-white/50">
                Snowflake alert table, DCP distributed compute, Solana devnet tamper-proof log.
              </p>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,.8)]" />
                <span className="font-mono text-[9px] tracking-[0.2em] text-emerald-300 uppercase">SYNCED</span>
              </div>
              <span className="badge-sandbox font-mono text-[9.5px] tracking-[0.28em] uppercase px-3 py-1 rounded-full">
                SANDBOX
              </span>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 mb-6">
          {[
            { id: "snowflake", label: "Snowflake", icon: Snowflake },
            { id: "dcp", label: "DCP Compute", icon: Server },
            { id: "solana", label: "Solana Ledger", icon: Link2 },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-mono text-[11px] tracking-[0.2em] uppercase transition-all ${
                activeTab === tab.id
                  ? "bg-white/10 border border-white/20 text-white"
                  : "bg-white/5 backdrop-blur-sm border border-white/5 text-white/50 hover:text-white/70"
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
          <button
            onClick={handleRefresh}
            className="ml-auto p-2.5 rounded-lg bg-white/5 backdrop-blur-sm border border-white/10 text-white/50 hover:text-white transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
          </button>
        </div>

        {/* Content */}
        <div className="bento-card rounded-2xl overflow-hidden bento-in">
          <span className="corner tl" />
          <span className="corner tr" />
          <span className="corner bl" />
          <span className="corner br" />

          {/* Snowflake Tab */}
          {activeTab === "snowflake" && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-mono text-[10px] tracking-[0.28em] uppercase text-white/50">
                  Alert Table · SENTINEL_DB.ALERTS
                </h2>
                <span className="font-mono text-[9px] text-white/30">
                  {SNOWFLAKE_ALERTS.length} records
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-3 px-4 font-mono text-[9px] tracking-[0.28em] uppercase text-white/40">ID</th>
                      <th className="text-left py-3 px-4 font-mono text-[9px] tracking-[0.28em] uppercase text-white/40">Timestamp</th>
                      <th className="text-left py-3 px-4 font-mono text-[9px] tracking-[0.28em] uppercase text-white/40">Type</th>
                      <th className="text-left py-3 px-4 font-mono text-[9px] tracking-[0.28em] uppercase text-white/40">Severity</th>
                      <th className="text-left py-3 px-4 font-mono text-[9px] tracking-[0.28em] uppercase text-white/40">Node</th>
                      <th className="text-left py-3 px-4 font-mono text-[9px] tracking-[0.28em] uppercase text-white/40">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {SNOWFLAKE_ALERTS.map((alert) => (
                      <tr key={alert.id} className="border-b border-white/5 hover:bg-white/[.02]">
                        <td className="py-3 px-4 font-mono text-[11px] text-white/70">{alert.id}</td>
                        <td className="py-3 px-4 font-mono text-[11px] text-white/50">
                          {new Date(alert.timestamp).toLocaleString()}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white/5 backdrop-blur-sm text-white/60">
                            {alert.type}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`font-mono text-[10px] px-2 py-0.5 rounded ${
                            alert.severity === "CRITICAL" ? "badge-critical" :
                            alert.severity === "HIGH" ? "badge-high" :
                            alert.severity === "MEDIUM" ? "badge-warning" : "badge-info"
                          }`}>
                            {alert.severity}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-[11px] text-white/50">{alert.node}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1.5 font-mono text-[10px] ${
                            alert.status === "ACTIVE" ? "text-amber-400" : "text-emerald-400"
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              alert.status === "ACTIVE" ? "bg-amber-400" : "bg-emerald-400"
                            }`} />
                            {alert.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* DCP Tab */}
          {activeTab === "dcp" && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-mono text-[10px] tracking-[0.28em] uppercase text-white/50">
                  Distributed Compute Pool
                </h2>
                <span className="font-mono text-[9px] text-emerald-400">
                  82 Workers Available
                </span>
              </div>

              <div className="space-y-3">
                {DCP_TASKS.map((task) => (
                  <div key={task.id} className="bg-black/30 rounded-lg border border-white/5 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-[10px] text-white/40">{task.id}</span>
                        <span className="font-mono text-[12px] text-white/80">{task.type}</span>
                      </div>
                      <span className={`font-mono text-[10px] px-2 py-0.5 rounded ${
                        task.status === "COMPLETE" ? "bg-emerald-500/15 text-emerald-400" :
                        task.status === "RUNNING" ? "bg-blue-500/15 text-blue-400" :
                        "bg-white/5 backdrop-blur-sm text-white/40"
                      }`}>
                        {task.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex-1">
                        <div className="h-2 bg-white/5 backdrop-blur-sm rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              task.status === "COMPLETE" ? "bg-emerald-500" :
                              task.status === "RUNNING" ? "bg-blue-500" : "bg-white/20"
                            }`}
                            style={{ width: `${task.progress}%` }}
                          />
                        </div>
                      </div>
                      <span className="font-mono text-[10px] text-white/50 w-12 text-right">
                        {task.progress}%
                      </span>
                      <span className="font-mono text-[10px] text-white/30">
                        {task.workers} workers
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Solana Tab */}
          {activeTab === "solana" && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="font-mono text-[10px] tracking-[0.28em] uppercase text-white/50">
                    Solana Devnet Ledger
                  </h2>
                  <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-500/15 border border-red-500/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                    <span className="font-mono text-[9px] text-red-300">DEVNET</span>
                  </span>
                </div>
                <a
                  href="https://explorer.solana.com/?cluster=devnet"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 font-mono text-[10px] text-white/40 hover:text-white transition-colors"
                >
                  Explorer <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="space-y-2">
                {SOLANA_LOGS.map((tx, i) => (
                  <div key={i} className="flex items-center gap-4 py-3 px-4 bg-black/30 rounded-lg border border-white/5">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-[11px] text-white/70">{tx.signature}</span>
                        <span className={`font-mono text-[9px] px-2 py-0.5 rounded ${
                          tx.status === "finalized" ? "bg-emerald-500/15 text-emerald-400" : "bg-blue-500/15 text-blue-400"
                        }`}>
                          {tx.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 font-mono text-[10px] text-white/40">
                        <span>Slot: {tx.slot.toLocaleString()}</span>
                        <span>·</span>
                        <span>{tx.type}</span>
                        <span>·</span>
                        <span>Fee: {tx.fee} SOL</span>
                      </div>
                    </div>
                    <a
                      href={`https://explorer.solana.com/tx/${tx.signature}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-white/5 backdrop-blur-sm text-white/40 hover:text-white hover:bg-white/10 transition-all"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>

              {/* Wallet info */}
              <div className="mt-6 p-4 rounded-lg bg-black/40 backdrop-blur-md border border-white/5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-mono text-[9px] tracking-[0.28em] uppercase text-white/40 mb-1">
                      Program Wallet
                    </p>
                    <p className="font-mono text-[12px] text-white/70">
                      9xK3...mR2q
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-[9px] tracking-[0.28em] uppercase text-white/40 mb-1">
                      Balance
                    </p>
                    <p className="font-mono text-[14px] text-white">
                      4.892 SOL
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-6 border-t border-white/5 flex items-center justify-between font-mono text-[9px] tracking-[0.28em] uppercase text-white/30">
          <span>Snowflake SENTINEL_DB · DCP v2.0 · Solana Devnet</span>
          <span>Last Sync: 2s ago · Records: 1,247</span>
        </footer>
      </main>
    </div>
  );
}


