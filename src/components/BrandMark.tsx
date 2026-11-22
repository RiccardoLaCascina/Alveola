import { cn } from "@/lib/utils";

// Marchio di Alveola: un panetto visto in sezione, con gli alveoli.
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" aria-hidden="true" className={cn("shrink-0", className)}>
      <rect width="40" height="40" rx="12" className="fill-primary" />
      <path
        d="M7 26c0-7.2 5.8-13 13-13s13 5.8 13 13c0 1.1-.9 2-2 2H9c-1.1 0-2-.9-2-2z"
        className="fill-primary-foreground"
      />
      <g className="fill-primary">
        <circle cx="15" cy="22" r="2.4" />
        <circle cx="22.5" cy="19" r="1.8" />
        <circle cx="25.5" cy="24.5" r="1.4" />
        <circle cx="19" cy="25.5" r="1.1" />
        <circle cx="11.5" cy="25.8" r="0.9" />
      </g>
    </svg>
  );
}
