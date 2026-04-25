"use client";
import { cn } from "@/lib/utils";
import React, { ReactNode } from "react";

interface AuroraBackgroundProps extends React.HTMLProps<HTMLDivElement> {
  children: ReactNode;
  showRadialGradient?: boolean;
  /** Hue rotation in degrees, retained for the Tweaks panel. */
  hueDeg?: number;
  /** Animation duration in seconds, retained for the Tweaks panel. */
  speed?: number;
}

/**
 * AuroraBackground — 21st.dev reference implementation.
 * Two stacked repeating-linear-gradients (a white-stripe mask + a blue/violet
 * aurora ribbon) blurred together, with the second copy animating via the
 * `aurora` keyframe in globals.css. `mix-blend-difference` and `invert` (light
 * mode) make the colour shift hypnotic without overpowering content.
 *
 * `hueDeg` and `speed` are wired through the existing Tweaks panel.
 */
export const AuroraBackground = ({
  className,
  children,
  showRadialGradient = true,
  hueDeg = 0,
  speed = 60,
  ...props
}: AuroraBackgroundProps) => {
  return (
    <main>
      <div
        className={cn(
          "relative flex flex-col min-h-screen items-stretch justify-start bg-zinc-50 dark:bg-zinc-900 text-slate-950 transition-bg",
          className
        )}
        {...props}
      >
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            filter: hueDeg ? `hue-rotate(${hueDeg}deg)` : undefined,
          }}
        >
          <div
            className={cn(
              `
              [--white-gradient:repeating-linear-gradient(100deg,var(--color-white)_0%,var(--color-white)_7%,var(--color-transparent)_10%,var(--color-transparent)_12%,var(--color-white)_16%)]
              [--dark-gradient:repeating-linear-gradient(100deg,var(--color-black)_0%,var(--color-black)_7%,var(--color-transparent)_10%,var(--color-transparent)_12%,var(--color-black)_16%)]
              [--aurora:repeating-linear-gradient(100deg,var(--color-blue-500)_10%,var(--color-indigo-300)_15%,var(--color-blue-300)_20%,var(--color-violet-200)_25%,var(--color-blue-400)_30%)]
              [background-image:var(--white-gradient),var(--aurora)]
              dark:[background-image:var(--dark-gradient),var(--aurora)]
              [background-size:300%,_200%]
              [background-position:50%_50%,50%_50%]
              filter blur-[10px] invert dark:invert-0
              after:content-[""] after:absolute after:inset-0 after:[background-image:var(--white-gradient),var(--aurora)]
              after:dark:[background-image:var(--dark-gradient),var(--aurora)]
              after:[background-size:200%,_100%]
              after:animate-aurora after:[background-attachment:fixed] after:mix-blend-difference
              pointer-events-none
              absolute -inset-[10px] opacity-50 will-change-transform`,
              showRadialGradient &&
                `[mask-image:radial-gradient(ellipse_at_100%_0%,black_10%,var(--color-transparent)_70%)]`
            )}
            style={{
              animationDuration: `${speed}s`,
            }}
          />
        </div>
        <div className="relative z-10 flex flex-col items-center justify-center w-full min-h-screen">
          {children}
        </div>
      </div>
    </main>
  );
};
