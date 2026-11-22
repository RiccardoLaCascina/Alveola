import { FlourSchema, type Flour } from "@/domain/model";
import { flourDisplayName } from "@/domain/presets";
import { db as defaultDb, type AlveolaDB } from "./db";

/*
  Repository delle farine: l'unico punto che legge e scrive l'archivio.
  I componenti passano dagli hook (src/state/flours.ts), che passano da qui.
  Ogni farina viene validata con lo schema Zod prima di essere salvata.
*/
export function createFlourRepository(db: AlveolaDB = defaultDb) {
  return {
    /** Tutte le farine, in ordine alfabetico per nome visualizzato. */
    async list(): Promise<Flour[]> {
      const all = await db.flours.toArray();
      return all
        .map((f) => FlourSchema.safeParse(f))
        .filter((r) => r.success)
        .map((r) => r.data)
        .sort((a, b) => flourDisplayName(a).localeCompare(flourDisplayName(b), "it"));
    },

    async get(id: string): Promise<Flour | undefined> {
      const f = await db.flours.get(id);
      const parsed = FlourSchema.safeParse(f);
      return parsed.success ? parsed.data : undefined;
    },

    /** Crea o aggiorna una farina; aggiorna la data di modifica. */
    async save(flour: Flour, now: number = Date.now()): Promise<Flour> {
      const toSave = FlourSchema.parse({ ...flour, name: flour.name.trim(), mill: flour.mill.trim(), updatedAt: now });
      await db.flours.put(toSave);
      return toSave;
    },

    async remove(id: string): Promise<void> {
      await db.flours.delete(id);
    },
  };
}

export const flourRepository = createFlourRepository();
