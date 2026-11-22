import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

type Chip = { key: string; label: string; onAdd: () => void };

/** Fila di pulsanti "+ qualcosa" per aggiungere elementi a una lista. */
export function AddChips({ chips }: { chips: Chip[] }) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {chips.map((c) => (
        <Button key={c.key} type="button" variant="outline" className="h-10 rounded-full border-dashed px-4" onClick={c.onAdd}>
          <Plus /> {c.label}
        </Button>
      ))}
    </div>
  );
}
