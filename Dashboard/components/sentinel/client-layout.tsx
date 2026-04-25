"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { Toaster } from "sonner";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { useTweaks, TweaksPanel, TweakSection, TweakSlider, TweakToggle, TweakRadio } from "@/components/sentinel/tweaks-panel";
import { GlassFilter } from "@/components/sentinel/glass-filter";

const TWEAK_DEFAULTS = {
  density: "regular",
  auroraHue: 1,
  auroraSpeed: 60,
  showGrain: true
};

const TweaksContext = createContext<any>(null);

export function useGlobalTweaks() {
  const context = useContext(TweaksContext);
  if (!context) {
    throw new Error("useGlobalTweaks must be used within a ClientLayout");
  }
  return context;
}

export function ClientLayout({ children }: { children: ReactNode }) {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  return (
    <TweaksContext.Provider value={{ t, setTweak }}>
      {/* Global SVG filter — referenced by .bento-card and <LiquidGlass /> */}
      <GlassFilter />
      {t.showGrain && <div className="grain" />}
      <div className="vignette" />
      <div className="scanline" />
      
      <AuroraBackground showRadialGradient={true} hueDeg={t.auroraHue} speed={t.auroraSpeed}>
        {children}
      </AuroraBackground>

      <Toaster
        position="top-right"
        theme="dark"
        toastOptions={{
          style: {
            background: "rgba(9,9,11,.85)",
            border: "1px solid rgba(255,255,255,.08)",
            color: "rgba(255,255,255,.85)",
            backdropFilter: "blur(8px)",
            fontFamily: "var(--font-jetbrains)",
            fontSize: "11px",
            letterSpacing: "0.05em",
          },
        }}
      />

      <TweaksPanel title="Sentinel Overrides">
        <TweakSection label="Visuals" />
        <TweakToggle label="Digital Grain" value={t.showGrain} onChange={(v: boolean) => setTweak('showGrain', v)} />
        <TweakRadio label="Density" value={t.density} options={['compact', 'regular', 'comfy']} onChange={(v: string) => setTweak('density', v)} />
        
        <TweakSection label="Atmosphere" />
        <TweakSlider label="Hue Shift" value={t.auroraHue} min={0} max={360} onChange={(v: number) => setTweak('auroraHue', v)} />
        <TweakSlider label="Turbulence" value={t.auroraSpeed} min={10} max={120} onChange={(v: number) => setTweak('auroraSpeed', v)} />
      </TweaksPanel>
    </TweaksContext.Provider>
  );
}
