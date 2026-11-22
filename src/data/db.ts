import Dexie, { type EntityTable } from "dexie";
import type { Flour } from "@/domain/model";

/*
  Database del telefono (IndexedDB, tramite Dexie).
  Ogni versione dello schema elenca le tabelle e gli indici; per aggiungere una tabella
  (es. le prove del diario) si aggiunge una nuova .version(n) senza toccare le precedenti.
*/
export class AlveolaDB extends Dexie {
  flours!: EntityTable<Flour, "id">;

  constructor(name = "alveola") {
    super(name);
    this.version(1).stores({
      // chiave primaria "id"; indici per ordinare e cercare
      flours: "id, name, mill, type, updatedAt",
    });
  }
}

export const db = new AlveolaDB();
