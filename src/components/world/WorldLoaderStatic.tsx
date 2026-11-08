/** Loader shown while the 3D chunk downloads (no three.js import here). */
export function WorldLoaderStatic() {
  return (
    <div className="absolute inset-0 grid place-items-center" role="status" aria-live="polite">
      <div className="glass flex items-center gap-3 rounded-full px-5 py-3 shadow-soft">
        <span className="relative flex h-3 w-3">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-forest opacity-60" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-forest" />
        </span>
        <span className="font-display text-sm font-semibold text-ink">Raising the island…</span>
      </div>
    </div>
  );
}
