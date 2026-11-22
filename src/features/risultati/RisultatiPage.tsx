import { PageTitle } from "@/components/PageTitle";
import { CompositionCard } from "./CompositionCard";
import { MaturationCard } from "./MaturationCard";
import { FlourCard } from "./FlourCard";

export function RisultatiPage() {
  return (
    <>
      <PageTitle title="Risultati" subtitle="Cosa dicono i numeri del tuo impasto." />
      <CompositionCard />
      <FlourCard />
      <MaturationCard />
    </>
  );
}
