import { useEffect, useId, useState } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { ChevronLeft, ClipboardList, RotateCcw, Star, Thermometer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Block } from "@/components/Block";
import { StatTile } from "@/components/StatTile";
import { NumberField } from "@/components/form/NumberField";
import { RatingInput } from "@/components/form/RatingInput";
import { RATING_KEYS, RATING_LABELS, averageRating, doughTempDeviation, rateTrial, type Trial, type TrialMeasured, type TrialRatings } from "@/domain/prova";
import { fmt, fmtGrams } from "@/domain/format";
import { flourDisplayName, PREFERMENT_PRESETS } from "@/domain/presets";
import { normalizeBlend } from "@/domain/miscela";
import { useDoughStore } from "@/state/doughStore";
import { removeTrial, saveTrial, useTrial } from "@/state/trials";
import { clockFromIso, formatTrialDate, trialTitle } from "./format";
import { TrialFeedback } from "./TrialFeedback";

/** Una prova del diario: fotografia dell'impasto, misure, e (dopo la cottura) voti e commento. */
export function TrialDetailPage() {
  const { id } = useParams();
  const trial = useTrial(id);

  if (trial === undefined) return <p className="py-10 text-center text-sm text-muted-foreground">Caricamento della prova…</p>;
  if (trial === null)
    return (
      <div className="py-10 text-center">
        <p className="mb-4 text-muted-foreground">Questa prova non c’è più.</p>
        <Button asChild variant="outline">
          <Link to="/diario">Torna al diario</Link>
        </Button>
      </div>
    );
  // key: se si passa a un'altra prova, il modulo riparte dai suoi dati
  return <TrialEditor key={trial.id} trial={trial} />;
}

function TrialEditor({ trial }: { trial: Trial }) {
  const navigate = useNavigate();
  const loadDough = useDoughStore((s) => s.loadDough);
  const commentId = useId();
  const [measured, setMeasured] = useState<TrialMeasured>(trial.measured);
  const [ratings, setRatings] = useState<TrialRatings>(trial.ratings);
  const [comment, setComment] = useState(trial.comment);
  const [busy, setBusy] = useState(false);

  // se la prova viene aggiornata altrove (es. un'altra scheda aperta), riallineiamo il modulo
  useEffect(() => {
    setMeasured(trial.measured);
    setRatings(trial.ratings);
    setComment(trial.comment);
    // dipende solo da updatedAt: cambia quando la prova salvata cambia davvero
  }, [trial.updatedAt]);

  const dirty =
    JSON.stringify(measured) !== JSON.stringify(trial.measured) ||
    JSON.stringify(ratings) !== JSON.stringify(trial.ratings) ||
    comment.trim() !== trial.comment;

  const save = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const next = rateTrial({ ...trial, measured }, ratings, comment);
      await saveTrial(next);
      toast.success(next.status === "done" ? "Prova completata." : "Prova salvata. Mancano ancora dei voti.");
    } catch {
      toast.error("Non sono riuscito a salvare la prova: riprova.");
    } finally {
      setBusy(false);
    }
  };

  const remove = async () => {
    try {
      await removeTrial(trial.id);
      toast.success("Prova eliminata.");
      navigate("/diario");
    } catch {
      toast.error("Non sono riuscito a eliminare la prova: riprova.");
    }
  };

  const reuse = () => {
    loadDough(trial.dough);
    toast.success("Ricetta della prova caricata come impasto di oggi.");
    navigate("/impasto");
  };

  const s = trial.summary;
  const d = trial.dough;
  const deviation = doughTempDeviation({ ...trial, measured });
  const avg = averageRating(ratings);
  const flourName = (id: string) => {
    const f = trial.flours.find((x) => x.id === id);
    return f ? flourDisplayName(f) : "Farina non più in archivio";
  };

  return (
    <>
      <Link to="/diario" className="mb-3 inline-flex h-11 items-center gap-1 text-sm text-muted-foreground">
        <ChevronLeft className="size-4" /> Diario
      </Link>
      <div className="mb-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-2xl font-extrabold">{trialTitle(trial)}</h2>
          {trial.status === "toRate" ? <Badge className="bg-warm/20 text-foreground">Da valutare</Badge> : <Badge variant="secondary">Completata</Badge>}
        </div>
        <p className="mt-1 text-muted-foreground first-letter:uppercase">{formatTrialDate(trial.createdAt)}</p>
      </div>

      <Block icon={ClipboardList} title="Impasto" hint="Fotografia salvata al momento della prova.">
        <div className="grid grid-cols-3 gap-2">
          <StatTile label="Idratazione" value={s.hydration != null ? `${fmt(s.hydration, 1)} %` : "—"} />
          <StatTile label="Peso" value={s.totalWeight != null ? `${fmt(s.totalWeight)} g` : "—"} note={s.pieces != null ? `${s.pieces} panetti` : undefined} />
          <StatTile label="Forza" value={s.effectiveW != null ? `W ${fmt(s.effectiveW, 0)}` : "—"} />
        </div>
        <ul className="mt-4 space-y-1.5 text-sm tabular-nums">
          <li>
            Farina {fmt(d.flour ?? 0)} g · acqua {fmt(d.water ?? 0)} g · sale {fmt(d.salt ?? 0)} g
            {d.fat ? ` · grassi ${fmt(d.fat)} g` : ""}
          </li>
          <li>
            Lievito {d.yeastType === "none" ? "nessuno" : `${fmtGrams(d.yeast ?? 0)} g ${d.yeastType === "dry" ? "secco" : "fresco"}`}
            {s.suggestedYeastGrams != null && <span className="text-muted-foreground"> (consigliato {fmtGrams(s.suggestedYeastGrams)} g)</span>}
          </li>
          {normalizeBlend(d.flourBlend).map((b) => (
            <li key={b.flourId} className="text-muted-foreground">
              {flourName(b.flourId)} — {fmt(b.share * 100, 0)} %
            </li>
          ))}
          {d.preferments.map((p) => (
            <li key={p.id}>
              {PREFERMENT_PRESETS[p.type].label} {fmt(p.weight ?? 0)} g al {fmt(p.hydration ?? 0)} %
            </li>
          ))}
          {d.phases.map((p) => (
            <li key={p.id} className="text-muted-foreground">
              {p.name || "Fase"} · {fmt(p.hours ?? 0, 1)} h a {fmt(p.temp ?? 20, 0)} °C{p.balled ? " · in panetti" : ""}
            </li>
          ))}
          {(clockFromIso(s.plannedStart) || clockFromIso(s.plannedReady)) && (
            <li>
              Programma: impasto {clockFromIso(s.plannedStart) ?? "—"} · staglio {clockFromIso(s.plannedBalling) ?? "—"} · pronto {clockFromIso(s.plannedReady) ?? "—"}
            </li>
          )}
        </ul>
        {trial.mixingNotes && <p className="mt-3 rounded-xl bg-muted/50 p-3 text-sm">{trial.mixingNotes}</p>}
        <Button variant="outline" className="mt-4 h-11 w-full rounded-xl" onClick={reuse}>
          <RotateCcw /> Rifai questo impasto oggi
        </Button>
      </Block>

      <Block icon={Thermometer} title="Misure in laboratorio" hint="Le temperature reali: sono il primo dato per confrontare le prove.">
        <div className="grid grid-cols-2 items-end gap-3">
          <NumberField
            label="Acqua usata"
            unit="°C"
            allowNegative
            placeholder={s.waterTempSuggested != null ? `consigliata ${fmt(s.waterTempSuggested, 0)}` : undefined}
            value={measured.waterTemp}
            onChange={(v) => setMeasured((m) => ({ ...m, waterTemp: v }))}
          />
          <NumberField
            label="Impasto a fine lavorazione"
            unit="°C"
            allowNegative
            placeholder={d.targetDoughTemp != null ? `voluta ${fmt(d.targetDoughTemp, 0)}` : undefined}
            value={measured.doughTemp}
            onChange={(v) => setMeasured((m) => ({ ...m, doughTemp: v }))}
          />
          <NumberField label="Laboratorio" unit="°C" allowNegative value={measured.ambientTemp} onChange={(v) => setMeasured((m) => ({ ...m, ambientTemp: v }))} />
          <NumberField label="Umidità" unit="%" value={measured.ambientHumidity} onChange={(v) => setMeasured((m) => ({ ...m, ambientHumidity: v }))} />
        </div>
        {deviation != null && Math.abs(deviation) >= 1 && (
          <p className="mt-3 rounded-xl bg-warm/15 px-3 py-2.5 text-sm">
            Impasto {deviation > 0 ? "più caldo" : "più freddo"} di {fmt(Math.abs(deviation), 1)} °C rispetto ai {fmt(d.targetDoughTemp ?? 0, 0)} °C voluti: la
            maturazione {deviation > 0 ? "sarà più veloce" : "sarà più lenta"} del previsto.
          </p>
        )}
      </Block>

      <Block icon={Star} title="Dopo la cottura" hint="Un voto da 1 a 5 per ogni voce, poi il tuo commento.">
        <div className="flex flex-col gap-5">
          {RATING_KEYS.map((k) => (
            <RatingInput
              key={k}
              label={RATING_LABELS[k].label}
              hint={RATING_LABELS[k].hint}
              value={ratings[k]}
              onChange={(v) => setRatings((r) => ({ ...r, [k]: v }))}
            />
          ))}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor={commentId} className="text-muted-foreground">
              Commento
            </Label>
            <Textarea
              id={commentId}
              rows={4}
              placeholder="Com’è andata? Cosa cambieresti la prossima volta?"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="text-base"
            />
          </div>
          {avg != null && (
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Star className="size-4 fill-primary text-primary" /> Media {fmt(avg, 1)} su 5
            </p>
          )}
        </div>
      </Block>

      <div className="sticky bottom-[calc(6.5rem+env(safe-area-inset-bottom))] z-20 mb-4">
        <Button size="lg" className="h-12 w-full rounded-xl text-base shadow-lg" disabled={!dirty || busy} onClick={save}>
          {dirty ? "Salva la prova" : "Prova salvata"}
        </Button>
      </div>

      <TrialFeedback trial={trial} dirty={dirty} />

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" className="mx-auto flex h-11 text-muted-foreground">
            <Trash2 /> Elimina questa prova
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminare la prova?</DialogTitle>
            <DialogDescription>La prova “{trialTitle(trial)}” verrà cancellata dal diario. Non si può annullare.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annulla</Button>
            </DialogClose>
            <Button variant="destructive" onClick={remove}>
              Elimina
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
