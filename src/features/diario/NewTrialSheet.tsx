import { useEffect, useId, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { NumberField } from "@/components/form/NumberField";
import { TextField } from "@/components/form/TextField";
import { StatTile } from "@/components/StatTile";
import { createTrial, type TrialMeasured } from "@/domain/prova";
import { fmt, fmtGrams } from "@/domain/format";
import { formatClock } from "@/domain/programma";
import { useDoughAnalysis, useDoughStore } from "@/state/doughStore";
import { useFlourArchive } from "@/state/flours";
import { saveTrial } from "@/state/trials";

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

/**
 * Momento 1 della prova: all'impasto.
 * Fotografa l'impasto di oggi (ricetta, farine, programma) e registra le temperature misurate.
 */
export function NewTrialSheet({ open, onOpenChange }: Props) {
  const dough = useDoughStore((s) => s.dough);
  const analysis = useDoughAnalysis();
  const { flours } = useFlourArchive();
  const navigate = useNavigate();
  const notesId = useId();

  const empty = (): TrialMeasured => ({ waterTemp: null, doughTemp: null, ambientTemp: dough.ambientTemp, ambientHumidity: dough.ambientHumidity });
  const [measured, setMeasured] = useState<TrialMeasured>(empty);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setMeasured(empty());
      setTitle("");
      setNotes("");
      setBusy(false);
    }
    // si riparte solo quando il pannello si apre
  }, [open]);

  const set = <K extends keyof TrialMeasured>(k: K, v: TrialMeasured[K]) => setMeasured((m) => ({ ...m, [k]: v }));
  const c = analysis.composition;

  const save = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const trial = createTrial({ dough, archive: flours, analysis, measured, title, mixingNotes: notes });
      await saveTrial(trial);
      toast.success("Prova registrata. Dopo la cottura aggiungi voti e commento.");
      onOpenChange(false);
      navigate(`/diario/${trial.id}`);
    } catch {
      toast.error("Non sono riuscito a salvare la prova: riprova.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="mx-auto max-h-[92dvh] max-w-xl overflow-y-auto rounded-t-3xl pb-[env(safe-area-inset-bottom)]">
        <SheetHeader className="pb-0">
          <SheetTitle className="font-heading text-xl font-extrabold">Registra la prova di oggi</SheetTitle>
          <SheetDescription>Salvo una fotografia dell’impasto attuale. Scrivi le temperature che hai misurato davvero.</SheetDescription>
        </SheetHeader>

        <div className="grid grid-cols-3 gap-2 px-4">
          <StatTile label="Idratazione" value={c.totalFlour > 0 ? `${fmt(c.hydration, 1)} %` : "—"} />
          <StatTile label="Impasto" value={c.totalWeight > 0 ? `${fmt(c.totalWeight)} g` : "—"} />
          <StatTile
            label="Staglio"
            value={analysis.schedule?.balling ? formatClock(analysis.schedule.balling) : "—"}
            note={analysis.schedule ? `pronto ${formatClock(analysis.schedule.ready)}` : undefined}
          />
        </div>

        <div className="grid grid-cols-2 items-end gap-3 px-4">
          <TextField label="Nome della prova (facoltativo)" placeholder="es. 48 h con 30 % manitoba" value={title} onChange={setTitle} className="col-span-2" />
          <NumberField
            label="Acqua usata"
            unit="°C"
            allowNegative
            placeholder={analysis.waterTemp != null ? `consigliata ${fmt(analysis.waterTemp, 0)}` : undefined}
            value={measured.waterTemp}
            onChange={(v) => set("waterTemp", v)}
          />
          <NumberField
            label="Impasto a fine lavorazione"
            unit="°C"
            allowNegative
            placeholder={dough.targetDoughTemp != null ? `voluta ${fmt(dough.targetDoughTemp, 0)}` : undefined}
            value={measured.doughTemp}
            onChange={(v) => set("doughTemp", v)}
          />
          <NumberField label="Laboratorio" unit="°C" allowNegative value={measured.ambientTemp} onChange={(v) => set("ambientTemp", v)} />
          <NumberField label="Umidità" unit="%" value={measured.ambientHumidity} onChange={(v) => set("ambientHumidity", v)} />
          <div className="col-span-2 flex flex-col gap-1.5">
            <Label htmlFor={notesId} className="text-muted-foreground">
              Note all’impasto
            </Label>
            <Textarea
              id={notesId}
              rows={3}
              placeholder="Tempo in impastatrice, come si è legato, farina nuova…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="text-base"
            />
          </div>
          {analysis.yeast && (
            <p className="col-span-2 text-xs text-muted-foreground">
              Nella fotografia entrano anche ricetta, farine, fasi e programma (lievito consigliato {fmtGrams(analysis.yeast.freshGrams)} g).
            </p>
          )}
        </div>

        <SheetFooter>
          <Button className="h-12 rounded-xl text-base" disabled={busy || c.totalFlour <= 0} onClick={save}>
            Registra la prova
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
