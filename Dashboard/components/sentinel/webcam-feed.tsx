"use client";

/**
 * WebcamFeed — owns getUserMedia, exposes a captureFrame() handle to parents.
 * Used by the dashboard's LiveFeed panel to drive the Crisis Loop.
 */

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

export interface WebcamHandle {
  captureFrame: () => string | null;
  isReady: () => boolean;
}

interface Props {
  className?: string;
  width?: number;
  height?: number;
  mirrored?: boolean;
}

export const WebcamFeed = forwardRef<WebcamHandle, Props>(function WebcamFeed(
  { className = "", width = 640, height = 360, mirrored = true },
  ref
) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: width }, height: { ideal: height }, facingMode: "user" },
          audio: false,
        });
        if (cancelled) return;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
          setReady(true);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Camera unavailable";
        setError(msg);
      }
    }

    start();

    return () => {
      cancelled = true;
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [width, height]);

  useImperativeHandle(ref, () => ({
    captureFrame: () => {
      const v = videoRef.current;
      if (!v || v.readyState < 2) return null;
      const canvas = canvasRef.current ?? document.createElement("canvas");
      canvas.width = v.videoWidth || width;
      canvas.height = v.videoHeight || height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      if (mirrored) {
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
      }
      ctx.drawImage(v, 0, 0, canvas.width, canvas.height);
      // jpeg @ 0.7 quality keeps payloads small
      return canvas.toDataURL("image/jpeg", 0.7);
    },
    isReady: () => ready,
  }));

  return (
    <div className={"relative w-full h-full overflow-hidden " + className}>
      <video
        ref={videoRef}
        playsInline
        muted
        autoPlay
        className={
          "absolute inset-0 w-full h-full object-cover " +
          (mirrored ? "[transform:scaleX(-1)]" : "")
        }
      />
      <canvas ref={canvasRef} className="hidden" />
      {!ready && !error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60">
          <span className="font-mono text-[10px] tracking-[0.28em] uppercase text-white/40 animate-pulse">
            Initialising camera…
          </span>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 px-6 text-center">
          <div className="space-y-1">
            <p className="font-mono text-[10px] tracking-[0.28em] uppercase text-red-400">
              Camera Unavailable
            </p>
            <p className="font-mono text-[10px] text-white/40 max-w-[260px]">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
});
