import Dexie, { type EntityTable } from "dexie";
import type { Flour } from "@/domain/model";

/*
  Database del telefono (IndexedDB, tramite Dexie).
  Ogni versione dello schema elenca le tabelle e gli indici; per aggiungere una tabella
  (es. le prove del diario) si aggiunge una nuova .version(n) senza toccare le precedenti.
*/
export const DB_NAME = "lievora";
/** Nome del database quando l'app si chiamava Alveola: i dati vengono spostati da lì al primo avvio. */
export const OLD_DB_NAME = "alveola";

export class LievoraDB extends Dexie {
  flours!: EntityTable<Flour, "id">;

  constructor(name = DB_NAME) {
    super(name);
    this.version(1).stores({
      // chiave primaria "id"; indici per ordinare e cercare
      flours: "id, name, mill, type, updatedAt",
    });
  }
}

export const db = new LievoraDB();

/**
 * Sposta le farine dal database con il vecchio nome ("alveola") a quello nuovo, una volta sola.
 * Non fa niente se il vecchio database non esiste. Non lancia mai errori: al massimo lascia i dati dove sono.
 */
export async function migrateFromOldName(target: LievoraDB = db, oldName = OLD_DB_NAME): Promise<number> {
  try {
    if (!(await Dexie.exists(oldName))) return 0;
    const old = new LievoraDB(oldName);
    const flours = await old.flours.toArray();
    if (flours.length) await target.flours.bulkPut(flours);
    old.close();
    await Dexie.delete(oldName);
    return flours.length;
  } catch {
    return 0;
  }
}
