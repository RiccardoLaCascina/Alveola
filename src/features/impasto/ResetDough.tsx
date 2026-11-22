import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useDoughStore } from "@/state/doughStore";

/** Azzera l'impasto ai valori di esempio, dopo conferma. */
export function ResetDough() {
  const reset = useDoughStore((s) => s.reset);
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="mx-auto mt-2 flex text-muted-foreground">
          <RotateCcw /> Ricomincia dall’esempio
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Ricominciare?</DialogTitle>
          <DialogDescription>Ingredienti, prefermenti, fasi e temperature tornano ai valori di esempio.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Annulla</Button>
          </DialogClose>
          <Button
            variant="destructive"
            onClick={() => {
              reset();
              setOpen(false);
              toast.success("Impasto riportato ai valori di esempio.");
            }}
          >
            Ricomincia
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
