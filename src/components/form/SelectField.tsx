import { useId, type ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Option<T extends string> = { value: T; label: string };

type SelectFieldProps<T extends string> = {
  label?: ReactNode;
  /** etichetta per lettori di schermo quando `label` non è visibile */
  ariaLabel?: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  className?: string;
};

export function SelectField<T extends string>({ label, ariaLabel, value, options, onChange, className }: SelectFieldProps<T>) {
  const id = useId();
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      {label && (
        <Label htmlFor={id} className="text-muted-foreground">
          {label}
        </Label>
      )}
      <Select value={value} onValueChange={(v) => onChange(v as T)}>
        <SelectTrigger id={id} aria-label={ariaLabel} className="h-12! w-full text-base">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value} className="py-2.5 text-base">
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
