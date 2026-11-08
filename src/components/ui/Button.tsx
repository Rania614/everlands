"use client";

import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "soft";
type Size = "sm" | "md" | "lg" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-ink text-cream shadow-soft hover:bg-[#3a4768] active:translate-y-px disabled:bg-ink/40",
  secondary:
    "bg-white/80 text-ink border border-twilight/30 hover:bg-white hover:border-twilight/60 active:translate-y-px",
  ghost: "text-ink-soft hover:bg-ink/5 hover:text-ink",
  soft: "bg-gold/40 text-ink hover:bg-gold/60 active:translate-y-px",
};

const SIZES: Record<Size, string> = {
  sm: "h-8 px-3 text-sm gap-1.5 rounded-xl",
  md: "h-10 px-4 text-sm gap-2 rounded-2xl",
  lg: "h-12 px-5 text-base gap-2 rounded-2xl",
  icon: "h-10 w-10 rounded-2xl",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = "secondary", size = "md", className, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex select-none items-center justify-center font-semibold transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-60",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    />
  );
});
