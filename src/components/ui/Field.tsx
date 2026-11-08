import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const inputClass =
  "h-10 w-full rounded-xl border border-twilight/30 bg-white/90 px-3 text-sm font-semibold text-ink outline-none placeholder:font-normal placeholder:text-ink-soft/70 focus:border-twilight disabled:opacity-60";

export function Field({ label, hint, children, className }: { label: string; hint?: string; children: (id: string) => ReactNode; className?: string }) {
  const id = useId();
  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={id} className="mb-1 block text-xs font-bold uppercase tracking-wider text-ink-soft">
        {label}
      </label>
      {children(id)}
      {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
    </div>
  );
}

export function TextInput({ label, hint, className, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return <Field label={label} hint={hint} className={className}>{(id) => <input id={id} className={inputClass} {...props} />}</Field>;
}

export function SelectInput({ label, hint, className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label: string; hint?: string }) {
  return (
    <Field label={label} hint={hint} className={className}>
      {(id) => (
        <select id={id} className={inputClass} {...props}>
          {children}
        </select>
      )}
    </Field>
  );
}

export function TextArea({ label, hint, className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; hint?: string }) {
  return (
    <Field label={label} hint={hint} className={className}>
      {(id) => <textarea id={id} rows={3} className={cn(inputClass, "h-auto py-2 font-normal")} {...props} />}
    </Field>
  );
}

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2 text-sm font-semibold text-ink"
    >
      <span className={cn("relative h-6 w-11 rounded-full transition-colors", checked ? "bg-forest" : "bg-ink/20")}>
        <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", checked ? "left-[22px]" : "left-0.5")} />
      </span>
      {label}
    </button>
  );
}

export function Chip({ children, color, className }: { children: ReactNode; color?: string; className?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold text-ink", className)}
      style={color ? { background: `${color}40` } : undefined}
    >
      {children}
    </span>
  );
}
