"use client";

import { cn } from "@/lib/utils";
import { useCrisisStore } from "@/store/useCrisisStore";
import { useResponder } from "@/hooks/useResponder";

// ── Icons ───────────────────────────────────────────────────────────────────
const Icon = {
  Shield: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3l8 3v6c0 5-3.5 8.5-8 9-4.5-.5-8-4-8-9V6l8-3z" />
    </svg>
  ),
  LogOut: (props: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M10 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h5" />
      <path d="M16 8l4 4-4 4" />
      <path d="M20 12H9" />
    </svg>
  ),
};

// ── Status Pill ─────────────────────────────────────────────────────────────
function StatusPill({
  color = "green",
  label,
  value,
}: {
  color?: "green" | "amber" | "red" | "white";
  label: string;
  value: string;
}) {
  const colorMap = {
    green: "bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,.8)]",
    amber: "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,.8)]",
    red: "bg-red-500 shadow-[0_0_10px_rgba(239,68,68,.8)]",
    white: "bg-white/80 shadow-[0_0_8px_rgba(255,255,255,.6)]",
  };

  return (
    <span
      className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 font-mono text-[9.5px] tracking-[0.28em] uppercase text-white/85 whitespace-nowrap"
      style={{
        background:
          "linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,.04))",
        backdropFilter: "blur(8px) saturate(140%)",
        WebkitBackdropFilter: "blur(8px) saturate(140%)",
        boxShadow:
          "inset 1px 1px 1px 0 rgba(255,255,255,.16), inset -1px -1px 1px 0 rgba(255,255,255,.04), 0 4px 10px rgba(0,0,0,.3)",
      }}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", colorMap[color])} />
      <span className="text-white/85">{label}</span>
      <span className="text-white/35">·</span>
      <span className="text-white/55">{value}</span>
    </span>
  );
}

// ── Top Nav ─────────────────────────────────────────────────────────────────
export function TopNav() {
  const status = useCrisisStore((s) => s.status);
  const threat = useCrisisStore((s) => s.threatData);
  const { user } = useResponder();

  // Map crisis status → DEFCON. CRISIS_ACTIVE = 2 (red), ANALYZING = 3 (amber),
  // IDLE = 5 (nominal). Lower number is more severe.
  const defcon = status === "CRISIS_ACTIVE" ? 2 : status === "ANALYZING" ? 3 : 5;
  const isCrisis = status === "CRISIS_ACTIVE";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-white/5 bg-zinc-950/70 backdrop-blur-xl">
      <div className="app-shell-container flex items-center justify-between gap-4 px-6 h-14">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <Icon.Shield className="w-4 h-4 text-white/50 shrink-0" />
          <span className="font-mono text-[11px] tracking-[0.32em] text-white/50 uppercase whitespace-nowrap shrink-0">
            Sentinel // Command
          </span>
          <span className="mx-2 h-3 w-px bg-white/10 shrink-0" />
          {/* Status pills — progressive disclosure so nothing clips on smaller
              widths. Header stays single-line; pills appear as room allows. */}
          <div className="hidden md:flex items-center gap-1.5 min-w-0">
            <StatusPill color="green" label="Edge Proxy" value="Healthy" />
            <span className="hidden lg:inline-flex">
              <StatusPill color="green" label="Gemma 4" value="Online" />
            </span>
            <span className="hidden lg:inline-flex">
              <StatusPill
                color={isCrisis ? "red" : "green"}
                label="Node 01"
                value={isCrisis ? (threat?.type ?? "Threat") : "Nominal"}
              />
            </span>
            <span className="hidden xl:inline-flex">
              <StatusPill color="green" label="Snowflake" value="Synced" />
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div className="hidden md:flex items-center gap-2 font-mono text-[10px] tracking-[0.32em] uppercase">
            <span className="text-white/40">DEFCON</span>
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <span
                  key={n}
                  className={cn(
                    "w-1.5 h-4 rounded-[1px]",
                    n >= defcon
                      ? defcon <= 2
                        ? "bg-red-500 shadow-[0_0_6px_rgba(239,68,68,.7)]"
                        : defcon === 3
                        ? "bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,.7)]"
                        : "bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,.7)]"
                      : "bg-white/10"
                  )}
                />
              ))}
            </div>
            <span
              className={cn(
                "text-lg leading-none font-black ml-1",
                defcon <= 2 ? "text-red-400" : defcon === 3 ? "text-amber-300" : "text-emerald-400"
              )}
            >
              {defcon}
            </span>
          </div>

          {/* Auth0 user pill */}
          {user && (
            <div
              className="hidden md:flex items-center gap-2 px-2 py-1 rounded-md border border-white/10"
              style={{
                background:
                  "linear-gradient(180deg, rgba(255,255,255,.12), rgba(255,255,255,.04))",
                backdropFilter: "blur(8px) saturate(140%)",
                WebkitBackdropFilter: "blur(8px) saturate(140%)",
                boxShadow:
                  "inset 1px 1px 1px 0 rgba(255,255,255,.16), inset -1px -1px 1px 0 rgba(255,255,255,.04)",
              }}
            >
              <div className="w-5 h-5 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                <span className="font-mono text-[8px] text-emerald-300">
                  {(user.name ?? "RX").slice(0, 2).toUpperCase()}
                </span>
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-mono text-[9px] tracking-[0.2em] uppercase text-white/70">
                  {user.name?.split(" ")[0] ?? "Responder"}
                </span>
                <span className="font-mono text-[8px] tracking-[0.2em] uppercase text-white/35">
                  {user.clearance ? `CLR-${user.clearance}` : "ACTIVE"}
                </span>
              </div>
            </div>
          )}

          <a
            href="/api/auth/logout"
            className="btn-logout group flex items-center gap-2 px-3 py-1.5 rounded-md border border-white/10 text-white/55 font-mono text-[10.5px] tracking-[0.22em] uppercase"
          >
            <Icon.LogOut className="w-3.5 h-3.5" />
            <span>Secure Logout</span>
          </a>
        </div>
      </div>
    </header>
  );
}
