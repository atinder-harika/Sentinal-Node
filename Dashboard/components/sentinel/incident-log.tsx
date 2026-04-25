"use client";

/**
 * IncidentLog — PRD §4.3 Panel 3
 *
 * Auto-appends new rows from the Zustand actionLog *and* hydrates with
 * Snowflake history at mount time so the table is never empty.
 */

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import { BentoCard } from "./bento-card";
import { useCrisisStore, type ActionLogEntry } from "@/store/useCrisisStore";

type Severity = "CRITICAL" | "HIGH" | "WARNING" | "INFO";

interface IncidentRow {
  id: string;
  timestamp: string;       // hh:mm:ss
  node: string;
  event: string;
  severity: Severity;
  source: "live" | "history";
}

interface HistoryRow {
  timestamp: string;
  node_id: string;
  event_type: string;
  details: string;
}

const severityStyles: Record<Severity, string> = {
  CRITICAL: "badge-critical",
  HIGH: "badge-high",
  WARNING: "badge-warning",
  INFO: "badge-info",
};

const severityFromEvent = (event_type: string): Severity => {
  if (/THREAT/i.test(event_type)) return "CRITICAL";
  if (/EVACUATION|DISPATCH/i.test(event_type)) return "HIGH";
  if (/MOTION|FALLBACK/i.test(event_type)) return "WARNING";
  return "INFO";
};

const fmtTime = (iso: string) => {
  try {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:${String(
      d.getSeconds()
    ).padStart(2, "0")}`;
  } catch {
    return iso;
  }
};

export function IncidentLog() {
  const actionLog = useCrisisStore((s) => s.actionLog);
  const [history, setHistory] = useState<HistoryRow[]>([]);

  useEffect(() => {
    let alive = true;
    fetch("/api/snowflake/history?limit=20")
      .then((r) => r.json())
      .then((j) => {
        if (alive && j.success) setHistory(j.data ?? []);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const rows = useMemo<IncidentRow[]>(() => {
    const liveRows: IncidentRow[] = actionLog.map((e: ActionLogEntry, i) => ({
      id: `LIVE-${actionLog.length - i}`,
      timestamp: fmtTime(e.timestamp),
      node: (e.node ?? "NODE-001").replace("NODE-", "N-"),
      event: e.message,
      severity: e.severity ?? "INFO",
      source: "live",
    }));
    const histRows: IncidentRow[] = history.map((h, i) => ({
      id: `INC-${String(i + 1).padStart(4, "0")}`,
      timestamp: fmtTime(h.timestamp),
      node: h.node_id.replace("NODE-", "N-"),
      event: `${h.event_type} · ${h.details}`,
      severity: severityFromEvent(h.event_type),
      source: "history",
    }));
    return [...liveRows, ...histRows].slice(0, 30);
  }, [actionLog, history]);

  return (
    <BentoCard className="lg:col-span-3" delay={270}>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-mono text-[10px] tracking-[0.28em] uppercase text-white/50 mb-1">
            Panel 04
          </h2>
          <h3 className="text-base font-semibold text-metal-tint tracking-tight">
            Live Incident Log
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-white/40">
            {rows.length} Events
          </span>
          <span className="flex items-center gap-1.5 px-2 py-1 rounded border border-emerald-500/20 bg-emerald-500/5">
            <span className="dot blink" />
            <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-emerald-400">
              Live
            </span>
          </span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="py-2 px-3 text-left font-mono text-[10px] tracking-[0.28em] uppercase text-white/50 font-medium">
                ID
              </th>
              <th className="py-2 px-3 text-left font-mono text-[10px] tracking-[0.28em] uppercase text-white/50 font-medium">
                Time
              </th>
              <th className="py-2 px-3 text-left font-mono text-[10px] tracking-[0.28em] uppercase text-white/50 font-medium">
                Node
              </th>
              <th className="py-2 px-3 text-left font-mono text-[10px] tracking-[0.28em] uppercase text-white/50 font-medium">
                Event
              </th>
              <th className="py-2 px-3 text-left font-mono text-[10px] tracking-[0.28em] uppercase text-white/50 font-medium">
                Severity
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="py-6 text-center font-mono text-[10px] tracking-[0.2em] uppercase text-white/30">
                  No events · waiting for first scan
                </td>
              </tr>
            )}
            {rows.map((incident) => (
              <tr
                key={incident.id}
                className={cn(
                  "border-b border-white/5 transition-colors hover:bg-white/[.02]",
                  incident.severity === "CRITICAL" && "bg-red-500/[.03]"
                )}
              >
                <td className="py-2.5 px-3 font-mono text-[11px] tracking-[0.1em] text-white/70">
                  {incident.id}
                </td>
                <td className="py-2.5 px-3 font-mono text-[11px] tracking-[0.1em] text-white/50">
                  {incident.timestamp}
                </td>
                <td className="py-2.5 px-3">
                  <span
                    className={cn(
                      "font-mono text-[11px] tracking-[0.1em]",
                      incident.node === "N-001" || incident.node === "N-01"
                        ? incident.severity === "CRITICAL"
                          ? "text-red-400"
                          : "text-white/70"
                        : "text-white/70"
                    )}
                  >
                    {incident.node}
                  </span>
                </td>
                <td className="py-2.5 px-3 font-mono text-[11px] tracking-[0.05em] text-white/80 max-w-[480px] truncate">
                  {incident.event}
                </td>
                <td className="py-2.5 px-3">
                  <span
                    className={cn(
                      "inline-block px-2 py-0.5 rounded font-mono text-[9px] tracking-[0.2em] uppercase",
                      severityStyles[incident.severity]
                    )}
                  >
                    {incident.severity}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </BentoCard>
  );
}
