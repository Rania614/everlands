import type { LocationId } from "@/types/world";
import { cn } from "@/lib/utils";

/**
 * Small hand-drawn style SVG vignette per location, used as the preview
 * thumbnail and in productivity views. Pure vector, no image requests.
 */
export function LocationThumbnail({ id, className }: { id: LocationId; className?: string }) {
  return (
    <svg viewBox="0 0 160 100" className={cn("block h-full w-full", className)} role="img" aria-hidden="true">
      <defs>
        <linearGradient id={`sky-${id}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#A9CBE0" />
          <stop offset="1" stopColor="#F3E9D7" />
        </linearGradient>
      </defs>
      <rect width="160" height="100" fill={`url(#sky-${id})`} />
      <ellipse cx="128" cy="20" rx="16" ry="6" fill="#fff" opacity="0.8" />
      <ellipse cx="36" cy="16" rx="12" ry="4.5" fill="#fff" opacity="0.7" />
      {/* island */}
      <path d="M18 70 Q80 58 142 70 L118 86 Q80 104 42 86 Z" fill="#A88468" />
      <ellipse cx="80" cy="70" rx="62" ry="12" fill="#A7C8A5" />
      <ellipse cx="80" cy="68" rx="56" ry="9" fill="#B8D6B2" />
      {id === "haven" && <Haven />}
      {id === "castle" && <Castle />}
      {id === "workshop" && <Workshop />}
      {id === "gardens" && <Gardens />}
    </svg>
  );
}

function Tree({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect x="-1.5" y="-4" width="3" height="8" rx="1" fill="#93694A" />
      <circle cx="0" cy="-10" r="8" fill="#789D84" />
      <circle cx="-3" cy="-12" r="4" fill="#9DBF98" />
    </g>
  );
}

function Haven() {
  return (
    <g>
      <ellipse cx="80" cy="68" rx="22" ry="5" fill="#E4DACA" />
      <ellipse cx="80" cy="64" rx="12" ry="3.5" fill="#CBBFAE" />
      <ellipse cx="80" cy="63" rx="10" ry="2.6" fill="#9FCBE2" />
      <rect x="77.5" y="48" width="5" height="15" rx="2" fill="#E4DACA" />
      <path d="M80 30 L86 40 L80 50 L74 40 Z" fill="#B9A1D3" />
      <path d="M80 30 L86 40 L80 40 Z" fill="#D6C6E6" />
      <Tree x={44} y={66} />
      <Tree x={118} y={66} s={1.1} />
      <circle cx="58" cy="70" r="2" fill="#E7A99C" />
      <circle cx="100" cy="71" r="2" fill="#E5C58F" />
      <circle cx="64" cy="72" r="1.6" fill="#B9A1D3" />
    </g>
  );
}

function Castle() {
  return (
    <g>
      <rect x="62" y="40" width="36" height="28" rx="2" fill="#F3E9D7" />
      <rect x="54" y="34" width="12" height="34" rx="2" fill="#EADFCB" />
      <rect x="94" y="34" width="12" height="34" rx="2" fill="#EADFCB" />
      <path d="M52 35 L60 18 L68 35 Z" fill="#7E9CC4" />
      <path d="M92 35 L100 18 L108 35 Z" fill="#7E9CC4" />
      <path d="M68 41 L80 24 L92 41 Z" fill="#8292B2" />
      <path d="M74 68 V58 a6 6 0 0 1 12 0 V68 Z" fill="#55607D" />
      <rect x="57.5" y="44" width="5" height="7" rx="2.5" fill="#F7E3B5" />
      <rect x="97.5" y="44" width="5" height="7" rx="2.5" fill="#F7E3B5" />
      <rect x="40" y="62" width="10" height="3" fill="#E7A99C" />
      <rect x="41" y="59" width="8" height="3" fill="#B9A1D3" />
      <rect x="40" y="56" width="10" height="3" fill="#8EB8D2" />
      <Tree x={124} y={67} s={0.9} />
    </g>
  );
}

function Workshop() {
  return (
    <g>
      <rect x="58" y="44" width="40" height="24" rx="2" fill="#B98A62" />
      <path d="M54 46 L78 28 L102 46 Z" fill="#E7A99C" />
      <rect x="88" y="26" width="6" height="12" fill="#93694A" />
      <circle cx="91" cy="20" r="4" fill="#fff" opacity="0.8" />
      <circle cx="96" cy="14" r="3" fill="#fff" opacity="0.6" />
      <rect x="72" y="54" width="12" height="14" rx="1.5" fill="#93694A" />
      <rect x="62" y="50" width="7" height="6" rx="1" fill="#F7E3B5" />
      <g transform="translate(118 50)">
        <circle r="10" fill="#E5C58F" />
        <circle r="4" fill="#B98A62" />
        {[0, 45, 90, 135, 180, 225, 270, 315].map((a) => (
          <rect key={a} x="-2" y="-13" width="4" height="5" fill="#E5C58F" transform={`rotate(${a})`} />
        ))}
      </g>
      <rect x="38" y="60" width="9" height="8" fill="#93694A" />
      <rect x="40" y="54" width="7" height="6" fill="#B98A62" />
    </g>
  );
}

function Gardens() {
  return (
    <g>
      <ellipse cx="80" cy="70" rx="26" ry="5" fill="#9FCBE2" />
      <rect x="62" y="44" width="4" height="24" fill="#F3E9D7" />
      <rect x="94" y="44" width="4" height="24" fill="#F3E9D7" />
      <path d="M62 46 Q80 26 98 46" fill="none" stroke="#F3E9D7" strokeWidth="4" />
      <path d="M60 44 Q80 14 100 44 Z" fill="#E4DACA" />
      <circle cx="80" cy="19" r="2.5" fill="#E5C58F" />
      <Tree x={42} y={66} s={1.05} />
      <Tree x={120} y={66} s={0.95} />
      <circle cx="56" cy="71" r="1.8" fill="#E7A99C" />
      <circle cx="106" cy="71" r="1.8" fill="#B9A1D3" />
    </g>
  );
}
