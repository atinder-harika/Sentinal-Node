"use client";

/**
 * LiquidGlass — a 3-layer glass wrapper used across the dashboard for any
 * surface that should sit on top of the aurora background while staying
 * legible. Mirrors the iOS / "Liquid Glass" treatment:
 *
 *   layer 0 — backdrop blur + #glass-distortion SVG filter
 *   layer 1 — soft white tint that gives the surface its body
 *   layer 2 — inset highlight border (top-left bright, bottom-right dim)
 *   layer 3 — content
 *
 * BentoCard already applies the same effect via the `.bento-card` CSS class,
 * so reach for this component for ad-hoc surfaces (status pills, manual
 * broadcast textarea, secure-logout button, etc.).
 */

import * as React from "react";
import { cn } from "@/lib/utils";

interface LiquidGlassProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  /** Tint strength for the white layer. 0–1, default 0.10 for dark mode. */
  tint?: number;
  /** Override the rounded radius. Pass any Tailwind rounded-* class. */
  radius?: string;
  /** When true, use a stronger tint (good for input surfaces). */
  solid?: boolean;
}

export const LiquidGlass = React.forwardRef<HTMLDivElement, LiquidGlassProps>(
  function LiquidGlass(
    { children, className, style, tint, radius = "rounded-2xl", solid, ...rest },
    ref
  ) {
    const tintAlpha = tint ?? (solid ? 0.16 : 0.1);

    return (
      <div
        ref={ref}
        {...rest}
        className={cn(
          "relative isolate overflow-hidden text-stone-100",
          radius,
          className
        )}
        style={{
          boxShadow:
            "0 6px 16px rgba(0,0,0,.35), 0 0 28px rgba(0,0,0,.18)",
          ...style,
        }}
      >
        {/* Layer 0 — distortion + blur */}
        <div
          aria-hidden
          className={cn("absolute inset-0 z-0 pointer-events-none", radius)}
          style={{
            backdropFilter: "blur(10px) saturate(140%)",
            WebkitBackdropFilter: "blur(10px) saturate(140%)",
            filter: "url(#glass-distortion)",
          }}
        />
        {/* Layer 1 — tint */}
        <div
          aria-hidden
          className={cn("absolute inset-0 z-10 pointer-events-none", radius)}
          style={{
            background: `linear-gradient(180deg, rgba(255,255,255,${
              tintAlpha + 0.04
            }), rgba(255,255,255,${tintAlpha * 0.55}))`,
          }}
        />
        {/* Layer 2 — inset highlight border */}
        <div
          aria-hidden
          className={cn("absolute inset-0 z-20 pointer-events-none", radius)}
          style={{
            boxShadow:
              "inset 1.5px 1.5px 1px 0 rgba(255,255,255,.18), inset -1px -1px 1px 1px rgba(255,255,255,.06)",
            border: "1px solid rgba(255,255,255,.10)",
            borderRadius: "inherit",
          }}
        />
        {/* Content */}
        <div className="relative z-30 h-full w-full">{children}</div>
      </div>
    );
  }
);
