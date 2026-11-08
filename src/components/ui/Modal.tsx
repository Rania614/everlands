"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import { useWorldStore } from "@/stores/worldStore";
import { Button } from "./Button";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg";
}

/** Open modals, innermost last: Escape only closes the top one. */
const modalStack: symbol[] = [];

/** Accessible dialog: focus moves in, Escape closes, focus returns on close. */
export function Modal({ open, onClose, title, description, children, footer, size = "md" }: ModalProps) {
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const me = Symbol("modal");
    modalStack.push(me);
    const t = setTimeout(() => {
      const first = panel.current?.querySelector<HTMLElement>("input, select, textarea, button:not([data-close])");
      (first ?? panel.current)?.focus();
    }, 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || modalStack[modalStack.length - 1] !== me) return;
      e.stopPropagation();
      onClose();
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey, true);
      modalStack.splice(modalStack.indexOf(me), 1);
      previous?.focus?.();
    };
  }, [open, onClose]);

  // Portal to <body> so dialogs sit above the HUD and navigation layers.
  if (typeof document === "undefined") return null;
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-ink/25 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
          <motion.div
            ref={panel}
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            tabIndex={-1}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 12, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className={cn(
              "flex max-h-[92vh] w-full flex-col overflow-hidden rounded-t-[28px] bg-paper shadow-lift outline-none sm:rounded-[28px]",
              size === "sm" ? "sm:max-w-md" : size === "md" ? "sm:max-w-xl" : "sm:max-w-3xl",
            )}
          >
            <header className="flex items-start gap-3 border-b border-ink/5 px-5 py-4">
              <div className="min-w-0 flex-1">
                <h2 id={titleId} className="font-display text-lg font-semibold text-ink">
                  {title}
                </h2>
                {description && <p className="mt-0.5 text-sm text-ink-soft">{description}</p>}
              </div>
              <button
                type="button"
                data-close
                onClick={onClose}
                className="grid h-8 w-8 place-items-center rounded-full text-ink-soft hover:bg-ink/5"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </header>
            <div className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
            {footer && <footer className="flex flex-wrap justify-end gap-2 border-t border-ink/5 px-5 py-3">{footer}</footer>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/** Renders confirmation requests raised anywhere via worldStore.ask(). */
export function DialogHost() {
  const dialog = useWorldStore((s) => s.dialog);
  const close = useWorldStore((s) => s.closeDialog);
  return (
    <Modal
      open={!!dialog}
      onClose={() => close(null)}
      title={dialog?.title ?? ""}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={() => close(null)}>
            Cancel
          </Button>
          {dialog?.actions.map((a) => (
            <Button key={a.id} variant={a.variant ?? "primary"} onClick={() => close(a.id)}>
              {a.label}
            </Button>
          ))}
        </>
      }
    >
      <p className="text-sm text-ink">{dialog?.message}</p>
      {dialog?.lines && (
        <ul className="mt-3 space-y-1.5">
          {dialog.lines.map((l) => (
            <li key={l} className="rounded-xl bg-white/80 px-3 py-2 text-sm font-semibold text-ink">
              {l}
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
