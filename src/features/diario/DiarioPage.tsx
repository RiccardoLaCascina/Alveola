import { Block } from "../../components/Block.tsx";

export function DiarioPage() {
  return (
    <>
      <Block
        title="Diario delle prove"
        hint="Ogni giorno: ricetta, temperature misurate, esito da 1 a 5 e commento."
      >
        <p className="empty">Ancora nessuna prova registrata.</p>
      </Block>
    </>
  );
}
