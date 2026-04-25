"use client";
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export const Icon = {
  Lock: (p: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <rect x="3.5" y="10.5" width="17" height="11" rx="2"/>
      <path d="M7.5 10.5V7a4.5 4.5 0 0 1 9 0v3.5"/>
      <circle cx="12" cy="16" r="1.5" fill="currentColor" stroke="none"/>
    </svg>
  ),
  Check: (p: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" {...p}>
      <path d="M4 12.5l5 5L20 6.5"/>
    </svg>
  ),
  Spinner: (p: any) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}>
      <path d="M12 3a9 9 0 1 0 9 9" />
    </svg>
  ),
  Sigil: (p: any) => (
    <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1.25" {...p}>
      <path d="M32 3 L55 14 L61 38 L46 58 L18 58 L3 38 L9 14 Z" opacity=".5" />
      <path d="M32 11 L48 18 L52 36 L41 51 L23 51 L12 36 L16 18 Z" opacity=".8" />
      <circle cx="32" cy="32" r="8"/>
      <circle cx="32" cy="32" r="2.2" fill="currentColor" stroke="none"/>
      <path d="M32 16 V24 M32 40 V48 M16 32 H24 M40 32 H48" />
    </svg>
  ),
};

const TELEMETRY = [
  "EDGE-NODE · PI-0A1 · GC-VISION READY",
  "GEMMA-4 ROUTER · 128K CTX · WARM",
  "ELEVENLABS BROADCAST · CH-07 · STBY",
  "GRID SYNC · NTP ±4ms · OK",
  "MESH · 24 NODES ONLINE · 0 DEGRADED",
];

export function TelemetryTicker(){
  const [i, setI] = useState(0);
  useEffect(()=>{
    const id = setInterval(()=> setI(x => (x+1) % TELEMETRY.length), 2400);
    return ()=> clearInterval(id);
  },[]);
  return (
    <div className="font-mono text-[10.5px] tracking-[0.22em] text-white/70 uppercase h-4 overflow-hidden relative w-[340px]">
      <AnimatePresence mode="wait">
        <motion.div key={i}
          initial={{ y: 8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -8, opacity: 0 }}
          transition={{ duration: .35 }}
          className="absolute inset-0 flex items-center justify-center gap-2">
          <span className="dot idle blink" />
          <span>{TELEMETRY[i]}</span>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export function CoreBlock({ status, onAuthorize }: { status: string, onAuthorize: () => void }){
  const titleSize = 'text-[112px] md:text-[180px]';
  const isAuth = status === 'AUTHENTICATING';
  const isDone = status === 'AUTHENTICATED';

  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: .2, duration: .9, ease: [0.22,1,0.36,1] }}
      className="relative z-10 flex flex-col items-center justify-center text-center px-6"
    >
      <motion.div
        initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
        transition={{ delay:.35, duration:.7 }}
        className="font-mono text-[11px] md:text-[12px] tracking-[0.5em] text-white/55 uppercase mb-6 flex items-center gap-3"
      >
        <span className="h-px w-10 bg-white/25" />
        Restricted Interface · Operator Authentication Required
        <span className="h-px w-10 bg-white/25" />
      </motion.div>

      <h1 className={cn(
        "title-monolith font-black tracking-tighter",
        titleSize
      )}>
        SENTINEL<span className="text-white/10 font-thin">·</span>NODE
      </h1>

      <motion.p
        initial={{ opacity:0, y:14 }} animate={{ opacity:1, y:0 }}
        transition={{ delay:.75, duration:.7 }}
        className="mt-8 max-w-2xl text-[17px] md:text-[20px] leading-[1.55] text-white/75"
      >
        Smart Emergency &amp; Disaster Evacuation System.
        <br/>
        <span className="text-white/45">Centralized threat intelligence and automated routing across Edge Node mesh.</span>
      </motion.p>

      <motion.div
        initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
        transition={{ delay:1.05, duration:.7 }}
        className="mt-14"
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.button
            key={status}
            onClick={status === 'IDLE' ? onAuthorize : undefined}
            disabled={isAuth}
            initial={{ opacity:0, scale:.96 }}
            animate={{ opacity:1, scale:1 }}
            exit={{ opacity:0, scale:.96 }}
            whileHover={{ scale: (isAuth || isDone) ? 1 : 1.03 }}
            whileTap={{ scale: (isAuth || isDone) ? 1 : 0.97 }}
            transition={{ duration:.28, ease:[0.22,1,0.36,1] }}
            className={cn(
              "btn-authorize relative rounded-xl px-8 py-[18px] text-white font-semibold tracking-[0.12em] text-[13.5px] uppercase flex items-center gap-3 whitespace-nowrap",
              isDone && "btn-authed"
            )}
          >
            {isAuth && (
              <>
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="inline-flex"
                >
                  <Icon.Spinner className="w-5 h-5" />
                </motion.span>
                <span className="caret">Verifying Operator</span>
              </>
            )}
            {isDone && (
              <>
                <Icon.Check className="w-5 h-5" />
                <span>Authenticated</span>
                <span className="font-mono text-[10.5px] text-white/85 tracking-[0.22em] pl-3 border-l border-white/30">CLR-L3</span>
              </>
            )}
            {!isAuth && !isDone && (
              <>
                <Icon.Lock className="w-5 h-5" />
                <span>Authorize Access</span>
                <span className="font-mono text-[10.5px] text-white/80 tracking-[0.22em] pl-3 border-l border-white/30">↵</span>
              </>
            )}
          </motion.button>
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

export function HUD({ status }: { status: string }){
  const common = "fixed z-20 font-mono uppercase text-[10.5px] tracking-[0.28em] text-white/55";
  return (
    <>
      <span className="hud-tick tl" />
      <span className="hud-tick tr" />
      <span className="hud-tick bl" />
      <span className="hud-tick br" />

      <motion.div
        initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }}
        transition={{ delay:.1, duration:.6 }}
        className={cn(common, "top-6 left-6 flex items-center gap-3")}
      >
        <Icon.Sigil className="w-7 h-7 text-white/85" />
        <div className="leading-[1.4] normal-case tracking-[0.22em]">
          <div className="text-white/80 font-mono tracking-[0.32em] uppercase">Sentinel // Node</div>
          <div className="text-white/35 font-mono tracking-[0.22em] uppercase">Ops Console · v0.4.1-alpha</div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity:0, x:10 }} animate={{ opacity:1, x:0 }}
        transition={{ delay:.2, duration:.6 }}
        className={cn(common, "top-6 right-6 flex items-center gap-6")}
      >
        <div className="flex items-center gap-2"><span className="dot idle blink"/>Standby</div>
        <div className="hidden md:flex items-center gap-2"><span className="dot ok"/>Mesh 24</div>
        <div className="hidden md:block">CLR-L3</div>
        <div className="hidden lg:block">↕ 7ms</div>
      </motion.div>

      <motion.div
        initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
        transition={{ delay:.35, duration:.6 }}
        className={cn(common, "bottom-6 left-6 leading-[1.8]")}
      >
        <div><span className="text-white/35">SESSION</span> &nbsp;<span className="text-white/85">SN-26-0424-9F</span></div>
        <div><span className="text-white/35">LOCALITY</span> &nbsp;<span className="text-white/85">ZN-07 · East Quadrant</span></div>
        <div><span className="text-white/35">HANDSHAKE</span> &nbsp;TLS 1.3 · mTLS · HSM 0x9F…A1</div>
      </motion.div>

      <motion.div
        initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
        transition={{ delay:.4, duration:.6 }}
        className={cn(common, "bottom-6 right-6 text-right leading-[1.8]")}
      >
        <div><span className="text-white/35">UPTIME</span> &nbsp;<span className="text-white/85">04:12:08</span></div>
        <div><span className="text-white/35">BUILD</span> &nbsp;<span className="text-white/85">26.04.24</span></div>
        <div><span className="text-white/35">LAT</span> &nbsp;<span className="text-white/85">7 ms</span></div>
      </motion.div>

      <motion.div
        initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }}
        transition={{ delay:.5, duration:.6 }}
        className="fixed z-20 bottom-7 left-1/2 -translate-x-1/2"
      >
        <TelemetryTicker />
      </motion.div>
    </>
  );
}

