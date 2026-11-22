import { useState } from "react";
import { ChevronRight, Plus, Wheat } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { PageTitle } from "@/components/PageTitle";
import type { Flour } from "@/domain/model";
import { FLOUR_TYPE_LABEL } from "@/domain/presets";
import { useFlourArchive } from "@/state/flours";
import { FlourFormSheet } from "./FlourFormSheet";
import { FlourSpecs } from "./FlourSpecs";

/** Archivio delle farine: elenco, nuova farina, modifica. */
export function FarinePage() {
  const { flours, loaded, failed } = useFlourArchive();
  const [editing, setEditing] = useState<Flour | undefined>();
  const [open, setOpen] = useState(false);

  const openNew = () => {
    setEditing(undefined);
    setOpen(true);
  };
  const openEdit = (f: Flour) => {
    setEditing(f);
    setOpen(true);
  };

  return (
    <>
      <PageTitle title="Farine" subtitle="Il tuo archivio: inseriscile una volta, poi scegli le miscele." />

      <Button size="lg" className="mb-4 h-12 w-full rounded-xl text-base" onClick={openNew} disabled={!loaded || failed}>
        <Plus /> Nuova farina
      </Button>

      {failed ? (
        <p className="rounded-2xl bg-warm/15 p-4 text-sm">
          L’archivio farine non è disponibile su questo dispositivo: il browser non permette di salvare dati (navigazione privata o memoria
          piena). Il resto dell’app funziona.
        </p>
      ) : !loaded ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Caricamento dell’archivio…</p>
      ) : flours.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <span className="grid size-14 place-items-center rounded-2xl bg-accent text-accent-foreground">
              <Wheat className="size-7" />
            </span>
            <p className="font-heading text-lg font-bold">Ancora nessuna farina</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              Aggiungi le farine che usi con W, P/L, proteine e assorbimento: l’app calcolerà il profilo di ogni miscela.
            </p>
          </CardContent>
        </Card>
      ) : (
        <ul className="flex flex-col gap-2">
          {flours.map((f) => (
            <li key={f.id}>
              <button
                type="button"
                onClick={() => openEdit(f)}
                className="flex w-full items-center gap-3 rounded-2xl border bg-card p-4 text-left transition-colors hover:bg-muted/50"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-flour/25 text-foreground">
                  <Wheat className="size-5" />
                </span>
                <span className="min-w-0 flex-1 space-y-1">
                  <span className="flex items-center gap-2">
                    <span className="truncate font-heading font-bold">{f.name}</span>
                    <Badge variant="secondary" className="shrink-0">
                      {FLOUR_TYPE_LABEL[f.type]}
                    </Badge>
                  </span>
                  {f.mill && <span className="block truncate text-sm text-muted-foreground">{f.mill}</span>}
                  <FlourSpecs flour={f} />
                </span>
                <ChevronRight className="size-5 shrink-0 text-muted-foreground" />
              </button>
            </li>
          ))}
        </ul>
      )}

      <FlourFormSheet open={open} onOpenChange={setOpen} flour={editing} />
    </>
  );
}
