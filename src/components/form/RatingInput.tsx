import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

type Props = {
  label: string;
  hint?: string;
  value: number | null;
  onChange: (value: number | null) => void;
};

/** Voto da 1 a 5 con cinque pulsanti grandi. Toccando di nuovo il voto scelto lo si toglie. */
export function RatingInput({ label, hint, value, onChange }: Props) {
  return (
    <div>
      <p className="font-medium">{label}</p>
      {hint && <p className="mb-2 text-xs text-muted-foreground">{hint}</p>}
      <ToggleGroup
        type="single"
        variant="outline"
        aria-label={label}
        value={value != null ? String(value) : ""}
        onValueChange={(v) => onChange(v ? Number(v) : null)}
        className="w-full"
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <ToggleGroupItem
            key={n}
            value={String(n)}
            aria-label={`${label}: ${n} su 5`}
            className="h-11 flex-1 text-base font-bold tabular-nums data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
          >
            {n}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
