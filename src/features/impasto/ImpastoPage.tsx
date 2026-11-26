import { FlaskConical, Layers, Wheat } from "lucide-react";
import { BlendEditor } from "./BlendEditor";
import { Block } from "@/components/Block";
import { PageTitle } from "@/components/PageTitle";
import { AddChips } from "@/components/AddChips";
import { EmptyHint } from "@/components/EmptyHint";
import { PREFERMENT_TYPES } from "@/domain/model";
import { PREFERMENT_SHORT_LABEL } from "@/domain/presets";
import { useDoughAnalysis, useDoughStore } from "@/state/doughStore";
import { PrefermentCard } from "./PrefermentCard";
import { RecipeCard } from "./RecipeCard";
import { ResetDough } from "./ResetDough";

/*
  La pagina segue l'ordine in cui ragiona il pizzaiolo:
  1. con quali farine  →  2. quanto impasto e quanta acqua  →  3. (se serve) biga, poolish, lievito madre.
*/
export function ImpastoPage() {
  const dough = useDoughStore((s) => s.dough);
  const setField = useDoughStore((s) => s.setField);
  const addPreferment = useDoughStore((s) => s.addPreferment);
  const c = useDoughAnalysis().composition;
  const percentMode = dough.recipe.mode === "percent";

  return (
    <>
      <PageTitle title="Impasto" subtitle="Scegli le farine e quanto impasto vuoi: i grammi li calcolo io." />

      <Block
        icon={Layers}
        title="1 · Le tue farine"
        hint="Quali farine usi e quanta parte di ognuna, in % (in totale 100). Dalla loro scheda tecnica ricavo forza e acqua consigliata."
      >
        <BlendEditor
          parts={dough.flourBlend}
          onChange={(parts) => setField("flourBlend", parts)}
          context="dell’impasto"
          totalGrams={c.flour}
          emptyText="Facoltativo, ma utile: aggiungi le farine che usi e ti suggerisco l’idratazione giusta per loro."
        />
      </Block>

      <Block icon={Wheat} title="2 · Quanto impasto">
        <RecipeCard />
      </Block>

      <Block
        icon={FlaskConical}
        title="3 · Biga, poolish, lievito madre"
        hint={
          percentMode
            ? "Facoltativo. Farina e acqua che contengono contano nel totale: i grammi da mettere in vasca si riducono da soli."
            : "Facoltativo. Farina e acqua che contengono si sommano a quelle della vasca nell’idratazione totale."
        }
      >
        <div className="flex flex-col gap-3">
          {dough.preferments.length === 0 ? (
            <EmptyHint>Nessuno: impasto diretto. Se ne usi uno, aggiungilo qui sotto.</EmptyHint>
          ) : (
            dough.preferments.map((p) => <PrefermentCard key={p.id} preferment={p} />)
          )}
        </div>
        <AddChips
          chips={PREFERMENT_TYPES.map((t) => ({ key: t, label: PREFERMENT_SHORT_LABEL[t], onAdd: () => addPreferment(t) }))}
        />
      </Block>

      <ResetDough />
    </>
  );
}
