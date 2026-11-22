import { cn } from "@/lib/utils";

/*
  Marchio di Lievora: una pagnotta vista in sezione, crosta dorata e mollica con alveoli irregolari.
  Disegno originale; gli stessi tracciati sono in scripts/brand/lievora-mark.svg, da cui si generano le icone.
  Colori fissi (non del tema): il marchio resta identico in chiaro e in scuro.
*/
export function BrandMark({ className, title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 64 64" role={title ? "img" : undefined} aria-hidden={title ? undefined : true} className={cn("shrink-0", className)}>
      {title && <title>{title}</title>}
      <defs>
        <linearGradient id="lv-crust" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#EDB560" />
          <stop offset="1" stopColor="#B4651F" />
        </linearGradient>
        <radialGradient id="lv-crumb" cx="0.5" cy="0.35" r="0.7">
          <stop offset="0" stopColor="#FBF0D9" />
          <stop offset="1" stopColor="#EBD3A6" />
        </radialGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill="#17130F" />
      <path d="M9 45C9 26.5 19.3 15 32 15s23 11.5 23 30z" fill="url(#lv-crust)" />
      <path d="M13.2 44.2C13.2 29.4 21.6 20 32 20s18.8 9.4 18.8 24.2z" fill="url(#lv-crumb)" />
      <rect x="8" y="44.2" width="48" height="3.2" rx="1.6" fill="#8E4C17" />
      {/* alveoli: forme irregolari, allungate dalla lievitazione */}
      <g fill="#4A2B14">
        <ellipse cx="26" cy="33" rx="3.2" ry="4.4" transform="rotate(-10 26 33)" />
        <ellipse cx="37.5" cy="30.5" rx="2.7" ry="3.8" transform="rotate(12 37.5 30.5)" />
        <ellipse cx="33" cy="39.6" rx="2.2" ry="2.6" />
        <ellipse cx="20.6" cy="38.4" rx="1.6" ry="2.2" transform="rotate(-20 20.6 38.4)" />
        <ellipse cx="44" cy="37.4" rx="1.8" ry="2.4" transform="rotate(15 44 37.4)" />
        <ellipse cx="31.4" cy="25.4" rx="1.4" ry="1.9" transform="rotate(-5 31.4 25.4)" />
        <ellipse cx="43" cy="27.4" rx="1.2" ry="1.6" transform="rotate(25 43 27.4)" />
        <ellipse cx="21.6" cy="29.6" rx="0.9" ry="1.2" transform="rotate(-15 21.6 29.6)" />
        <ellipse cx="39" cy="41.6" rx="1.1" ry="1.3" />
        <ellipse cx="27" cy="41.7" rx="0.9" ry="1" />
        <ellipse cx="47.6" cy="33.4" rx="0.7" ry="0.9" transform="rotate(20 47.6 33.4)" />
        <ellipse cx="36" cy="23.7" rx="0.8" ry="1" />
        <ellipse cx="17.6" cy="34.4" rx="0.7" ry="0.9" transform="rotate(-25 17.6 34.4)" />
      </g>
    </svg>
  );
}
