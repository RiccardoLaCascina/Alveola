import { PageTitle } from "@/components/PageTitle";
import { CompositionCard } from "./CompositionCard";
import { MaturationCard } from "./MaturationCard";

export function RisultatiPage() {
  return (
    <>
      <PageTitle title="Risultati" subtitle="Cosa dicono i numeri del tuo impasto." />
      <CompositionCard />
      <MaturationCard />
    </>
  );
}
