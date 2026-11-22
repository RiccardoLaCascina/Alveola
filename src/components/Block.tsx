import type { ReactNode } from "react";

type BlockProps = {
  title: string;
  hint?: string;
  children?: ReactNode;
};

// Riquadro con titolo e suggerimento, usato da tutte le schede.
// È un esempio di componente condiviso: riceve dati (props) e li disegna, senza logica.
export function Block({ title, hint, children }: BlockProps) {
  return (
    <section className="block">
      <h2>{title}</h2>
      {hint && <p className="hint">{hint}</p>}
      {children}
    </section>
  );
}
