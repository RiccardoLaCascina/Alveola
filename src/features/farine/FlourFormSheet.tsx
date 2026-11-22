import { useEffect, useId, useRef, useState } from "react";
import { Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { NumberField } from "@/components/form/NumberField";
import { SelectField } from "@/components/form/SelectField";
import { TextField } from "@/components/form/TextField";
import { FLOUR_TYPES, type Flour } from "@/domain/model";
import { FLOUR_TYPE_LABEL, createFlour, flourDisplayName } from "@/domain/presets";
import { removeFlour, saveFlour } from "@/state/flours";

const TYPE_OPTIONS = FLOUR_TYPES.map((t) => ({ value: t, label: FLOUR_TYPE_LABEL[t] }));

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** farina da modificare; undefined = nuova farina */
  flour?: Flour;
  /** chiamata dopo il salvataggio (es. per aggiungerla subito alla miscela) */
  onSaved?: (flour: Flour) => void;
};

/** Modulo della scheda tecnica di una farina, in un pannello che sale dal basso. */
export function FlourFormSheet({ open, onOpenChange, flour, onSaved }: Props) {
  const [draft, setDraft] = useState<Flour>(() => flour ?? createFlour());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [busy, setBusy] = useState(false);
  const notesId = useId();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const isNew = !flour;

  // Ogni volta che il pannello si apre, riparte dalla farina scelta (o da una nuova).
  useEffect(() => {
    if (open) {
      setDraft(flour ?? createFlour());
      setConfirmDelete(false);
      setBusy(false);
    }
  }, [open, flour]);

  const set = <K extends keyof Flour>(key: K, value: Flour[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const canSave = draft.name.trim().length > 0;

  // Esegue un'operazione sul database una volta sola (niente doppio tocco) e avvisa se fallisce.
  const run = async (op: () => Promise<void>, errorMessage: string) => {
    if (busy) return;
    setBusy(true);
    try {
      await op();
    } catch {
      toast.error(errorMessage);
    } finally {
      setBusy(false);
    }
  };

  const save = () =>
    run(async () => {
      const saved = await saveFlour(draft);
      toast.success(isNew ? `${flourDisplayName(saved)} aggiunta all’archivio.` : "Farina aggiornata.");
      onSaved?.(saved);
      onOpenChange(false);
    }, "Non sono riuscito a salvare la farina: riprova.");

  const remove = () =>
    run(async () => {
      if (!flour) return;
      await removeFlour(flour.id);
      toast.success(`${flourDisplayName(flour)} eliminata dall’archivio.`);
      onOpenChange(false);
    }, "Non sono riuscito a eliminare la farina: riprova.");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="mx-auto max-h-[92dvh] max-w-xl overflow-y-auto rounded-t-3xl pb-[env(safe-area-inset-bottom)]"
        onOpenAutoFocus={(e) => {
          // Aprendo una farina esistente non selezioniamo il nome (un tocco lo cancellerebbe):
          // il focus va sul titolo, così il pannello resta accessibile da tastiera e lettori di schermo.
          if (!isNew) {
            e.preventDefault();
            titleRef.current?.focus();
          }
        }}
      >
        <SheetHeader className="pb-0">
          <SheetTitle ref={titleRef} tabIndex={-1} className="font-heading text-xl font-extrabold outline-none">{isNew ? "Nuova farina" : "Modifica farina"}</SheetTitle>
          <SheetDescription>I dati sono sulla scheda tecnica del sacco o del molino. Lascia vuoto quello che non sai.</SheetDescription>
        </SheetHeader>

        <div className="grid grid-cols-2 gap-3 px-4">
          <TextField label="Nome" placeholder="es. Pizzeria Oro" value={draft.name} onChange={(v) => set("name", v)} className="col-span-2" />
          <TextField label="Molino / marca" placeholder="es. Molino Rossi" value={draft.mill} onChange={(v) => set("mill", v)} />
          <SelectField label="Tipo" value={draft.type} options={TYPE_OPTIONS} onChange={(v) => set("type", v)} />
          <NumberField label="Forza (W)" placeholder="es. 300" value={draft.w} onChange={(v) => set("w", v)} />
          <NumberField label="P/L" placeholder="es. 0,55" value={draft.pl} onChange={(v) => set("pl", v)} />
          <NumberField label="Proteine" unit="%" placeholder="es. 12,5" value={draft.protein} onChange={(v) => set("protein", v)} />
          <NumberField label="Assorbimento" unit="%" placeholder="es. 60" value={draft.absorption} onChange={(v) => set("absorption", v)} />
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor={notesId} className="text-muted-foreground">
              Note
            </Label>
            <Textarea
              id={notesId}
              rows={3}
              placeholder="Come si comporta, dove la compri, lotto…"
              value={draft.notes}
              onChange={(e) => set("notes", e.target.value)}
              className="text-base"
            />
          </div>
        </div>

        <SheetFooter className="flex-row gap-2">
          {confirmDelete ? (
            <>
              <Button variant="outline" className="h-12 rounded-xl" disabled={busy} onClick={() => setConfirmDelete(false)}>
                Annulla
              </Button>
              <Button variant="destructive" className="h-12 flex-1 rounded-xl" disabled={busy} onClick={remove}>
                <Trash2 /> Conferma eliminazione
              </Button>
            </>
          ) : (
            <>
              {!isNew && (
                <Button variant="outline" className="h-12 rounded-xl" disabled={busy} onClick={() => setConfirmDelete(true)} aria-label="Elimina farina">
                  <Trash2 />
                </Button>
              )}
              <Button className="h-12 flex-1 rounded-xl text-base" disabled={!canSave || busy} onClick={save}>
                {isNew ? "Aggiungi all’archivio" : "Salva"}
              </Button>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
