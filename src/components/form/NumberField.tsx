import { useEffect, useId, useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** "12,5" o "12.5" → 12.5; vuoto o non numerico → null. */
export function parseDecimal(text: string): number | null {
  const t = text.trim().replace(",", ".");
  if (t === "" || t === "-" || t === ".") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

const toText = (v: number | null) => (v === null ? "" : String(v).replace(".", ","));

type NumberFieldProps = {
  label: ReactNode;
  value: number | null;
  onChange: (value: number | null) => void;
  unit?: string;
  placeholder?: string;
  disabled?: boolean;
  /** consente numeri negativi (temperature) */
  allowNegative?: boolean;
  className?: string;
};

/*
  Campo numerico pensato per il telefono:
  - tastiera numerica (inputMode="decimal") e virgola italiana accettata;
  - tiene il testo mentre scrivi ("2," resta "2,"), ma comunica subito il numero allo stato;
  - se il valore cambia da fuori (es. "Usa questa dose", "Ricomincia") il testo si aggiorna.
*/
export function NumberField({ label, value, onChange, unit, placeholder, disabled, allowNegative, className }: NumberFieldProps) {
  const id = useId();
  const [text, setText] = useState(() => toText(value));

  useEffect(() => {
    setText((current) => (parseDecimal(current) === value ? current : toText(value)));
  }, [value]);

  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <Label htmlFor={id} className="text-muted-foreground">
        {label}
      </Label>
      <div className="relative">
        <Input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          enterKeyHint="next"
          disabled={disabled}
          placeholder={placeholder}
          value={text}
          onChange={(e) => {
            const raw = allowNegative ? e.target.value : e.target.value.replace("-", "");
            if (!/^-?[0-9]*[.,]?[0-9]*$/.test(raw)) return;
            setText(raw);
            onChange(parseDecimal(raw));
          }}
          className={cn("h-12 text-lg tabular-nums", unit && "pr-11")}
        />
        {unit && (
          <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm text-muted-foreground">{unit}</span>
        )}
      </div>
    </div>
  );
}
