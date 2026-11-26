import { PageTitle } from "@/components/PageTitle";
import { CompositionCard } from "./CompositionCard";
import { MaturationCard } from "./MaturationCard";
import { FlourCard } from "./FlourCard";
import { AdviceCard } from "./AdviceCard";

export function RisultatiPage() {
  return (
    <>
      <PageTitle title="Risultati" subtitle="Cosa dicono i numeri del tuo impasto." />
      <CompositionCard />
      <FlourCard />
      <MaturationCard />
      <AdviceCard />
    </>
  );
}
