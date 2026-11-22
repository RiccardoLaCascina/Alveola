import { Block } from "../../components/Block.tsx";

export function TempiPage() {
  return (
    <>
      <Block title="Fasi" hint="Puntata, frigo, appretto: durata e temperatura di ogni riposo." />
      <Block title="Temperature di impastamento" hint="Per calcolare a che temperatura usare l'acqua." />
      <Block title="Farina e programma" hint="Forza (W) e ora di inizio." />
    </>
  );
}
