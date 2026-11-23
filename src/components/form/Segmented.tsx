import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

type Option<T extends string> = { value: T; label: string };

/**
 * Scelta tra 2–3 opzioni a pulsanti (sempre una selezionata).
 * La voce attiva prende il colore principale, così si vede subito quale è scelta.
 */
export function Segmented<T extends string>({
  value,
  options,
  onChange,
  ariaLabel,
  className,
}: {
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <ToggleGroup
      type="single"
      variant="outline"
      value={value}
      aria-label={ariaLabel}
      // "" arriva quando si ritocca la voce già scelta: la ignoriamo, resta sempre una scelta
      onValueChange={(v) => v && onChange(v as T)}
      className={cn("w-full", className)}
    >
      {options.map((o) => (
        <ToggleGroupItem
          key={o.value}
          value={o.value}
          className="h-11 flex-1 px-2 text-sm data-[state=on]:border-primary data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
        >
          {o.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
