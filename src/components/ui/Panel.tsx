import type { HTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PanelProps extends Omit<HTMLAttributes<HTMLElement>, "title"> {
  as?: "section" | "div" | "aside" | "article";
  title?: ReactNode;
  eyebrow?: ReactNode;
  actions?: ReactNode;
}

export function Panel({ as: Tag = "section", title, eyebrow, actions, className, children, ...rest }: PanelProps) {
  return (
    <Tag className={cn("glass rounded-3xl p-4 shadow-soft sm:p-5", className)} {...rest}>
      {(title || actions || eyebrow) && (
        <header className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            {eyebrow && (
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-ink-soft">{eyebrow}</p>
            )}
            {title && <h2 className="font-display text-lg font-semibold leading-tight text-ink">{title}</h2>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-1">{actions}</div>}
        </header>
      )}
      {children}
    </Tag>
  );
}
