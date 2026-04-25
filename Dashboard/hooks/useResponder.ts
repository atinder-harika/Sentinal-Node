"use client";

/**
 * useResponder — minimal client-side hook that fetches the active responder
 * profile from /api/auth/me. Returns a stub user if Auth0 is not wired so the
 * UI keeps working during development.
 */
import { useEffect, useState } from "react";

export interface ResponderProfile {
  sub: string;
  name: string;
  email: string;
  picture?: string;
  clearance?: string;
  org?: string;
}

export function useResponder() {
  const [user, setUser] = useState<ResponderProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((j) => {
        if (!alive) return;
        setUser(j.user ?? j);
      })
      .catch(() => alive && setUser(null))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  return { user, loading };
}
