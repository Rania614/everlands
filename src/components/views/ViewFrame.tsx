"use client";

import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { useWorldNavigation } from "@/hooks/useWorldNavigation";
import { Button } from "../ui/Button";

interface ViewFrameProps {
  title: string;
  eyebrow?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}

/** Shared shell for productivity views: readable, calm, one tap back to the world. */
export function ViewFrame({ title, eyebrow, icon, actions, children }: ViewFrameProps) {
  const { backToWorld } = useWorldNavigation();
  return (
    <motion.main
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="pointer-events-auto mx-auto flex h-full w-full max-w-5xl flex-col"
      aria-labelledby="view-title"
    >
      <div className="glass flex min-h-0 flex-1 flex-col overflow-hidden rounded-[28px] shadow-lift">
        <header className="flex flex-wrap items-center gap-3 border-b border-white/70 px-4 py-3 sm:px-6 sm:py-4">
          <Button variant="secondary" size="sm" onClick={backToWorld} aria-label="Back to world">
            <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">World</span>
          </Button>
          {icon && <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gold/40 text-ink">{icon}</span>}
          <div className="min-w-0 flex-1">
            {eyebrow && <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-soft">{eyebrow}</p>}
            <h2 id="view-title" className="font-display text-xl font-semibold leading-tight text-ink sm:text-2xl">
              {title}
            </h2>
          </div>
          {actions}
        </header>
        <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">{children}</div>
      </div>
    </motion.main>
  );
}
