"use client";

import { cn } from "@/lib/utils";
import { useRef, type ReactNode, type MouseEvent } from "react";

interface BentoCardProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export function BentoCard({ children, className, delay = 0 }: BentoCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const onMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", ((e.clientX - r.left) / r.width) * 100 + "%");
    el.style.setProperty("--my", ((e.clientY - r.top) / r.height) * 100 + "%");
  };

  return (
    <article
      ref={ref}
      onMouseMove={onMouseMove}
      className={cn(
        "bento-card bento-in rounded-2xl p-5 flex flex-col overflow-hidden",
        className
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <span className="corner tl" />
      <span className="corner tr" />
      <span className="corner bl" />
      <span className="corner br" />
      {children}
    </article>
  );
}
