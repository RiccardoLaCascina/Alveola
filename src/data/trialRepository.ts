import { TrialSchema, type Trial } from "@/domain/prova";
import { db as defaultDb, type LievoraDB } from "./db";

/*
  Repository delle prove del diario: l'unico punto che legge e scrive le prove.
  Ogni prova è validata con lo schema Zod in lettura e in scrittura.
*/
export function createTrialRepository(db: LievoraDB = defaultDb) {
  return {
    /** Tutte le prove, dalla più recente. */
    async list(): Promise<Trial[]> {
      const all = await db.trials.orderBy("createdAt").reverse().toArray();
      return all
        .map((t) => TrialSchema.safeParse(t))
        .filter((r) => r.success)
        .map((r) => r.data);
    },

    async get(id: string): Promise<Trial | undefined> {
      const parsed = TrialSchema.safeParse(await db.trials.get(id));
      return parsed.success ? parsed.data : undefined;
    },

    async save(trial: Trial): Promise<Trial> {
      const toSave = TrialSchema.parse(trial);
      await db.trials.put(toSave);
      return toSave;
    },

    async remove(id: string): Promise<void> {
      await db.trials.delete(id);
    },
  };
}

export const trialRepository = createTrialRepository();
