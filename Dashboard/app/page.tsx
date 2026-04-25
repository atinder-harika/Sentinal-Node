"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CoreBlock, HUD } from "@/components/sentinel/auth-core";
import { useGlobalTweaks } from "@/components/sentinel/client-layout";

export default function App() {
  const { t } = useGlobalTweaks();
  const [status, setStatus] = useState<"IDLE" | "AUTHENTICATING" | "AUTHENTICATED">("IDLE");
  const router = useRouter();

  const authorize = useCallback(() => {
    if (status !== "IDLE") return;
    setStatus("AUTHENTICATING");
    setTimeout(() => {
      setStatus("AUTHENTICATED");
      setTimeout(() => {
        router.push("/modules");
      }, 800);
    }, 1600);
  }, [status, router]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") authorize();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [authorize]);

  return (
    <>
      <HUD status={status} />
      <CoreBlock status={status} onAuthorize={authorize} density={t.density} />
    </>
  );
}
