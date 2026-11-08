"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bell, PartyPopper, X } from "lucide-react";
import { useEffect } from "react";
import { useWorldStore } from "@/stores/worldStore";

/** Subtle completion confirmation. Auto-dismisses; can be closed immediately. */
export function Toast() {
  const toast = useWorldStore((s) => s.toast);
  const dismiss = useWorldStore((s) => s.dismissToast);
  const dragonName = useWorldStore((s) => s.settings.dragonName);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(dismiss, 3200);
    return () => clearTimeout(t);
  }, [toast, dismiss]);

  return (
    <div className="pointer-events-none absolute inset-x-0 top-20 z-40 flex justify-center px-4 md:bottom-20 md:top-auto" aria-live="polite" role="status">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="glass pointer-events-auto flex max-w-sm items-center gap-3 rounded-2xl py-2.5 pl-3 pr-2 shadow-lift"
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-meadow/60 text-ink">
              {toast.kind === "celebrate" ? <PartyPopper className="h-5 w-5" /> : <Bell className="h-5 w-5" />}
            </span>
            <div className="min-w-0">
              <p className="font-display text-sm font-semibold text-ink">{toast.title}</p>
              <p className="text-xs text-ink-soft">
                {toast.message}
                {toast.kind === "celebrate" ? ` ${dragonName} is cheering.` : ""}
              </p>
            </div>
            <button type="button" onClick={dismiss} className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-ink-soft hover:bg-ink/5" aria-label="Dismiss">
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
