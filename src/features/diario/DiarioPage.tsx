import { NotebookPen, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PageTitle } from "@/components/PageTitle";

export function DiarioPage() {
  return (
    <>
      <PageTitle title="Diario" subtitle="Ogni prova ti avvicina all'impasto perfetto." />
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
          <span className="grid size-14 place-items-center rounded-2xl bg-accent text-accent-foreground">
            <NotebookPen className="size-7" />
          </span>
          <div className="space-y-1">
            <p className="font-heading text-lg font-bold">Ancora nessuna prova</p>
            <p className="max-w-xs text-sm text-muted-foreground">
              Registra ricetta, temperature misurate, esito da 1 a 5 e il tuo commento.
            </p>
          </div>
          <Button size="lg" className="rounded-full" onClick={() => toast("Il diario è il prossimo passo da costruire.")}>
            <Plus /> Nuova prova
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
