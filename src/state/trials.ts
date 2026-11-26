import { useLiveQuery } from "dexie-react-hooks";
import type { Trial } from "@/domain/prova";
import { trialRepository } from "@/data/trialRepository";

const EMPTY: Trial[] = [];
type Result = { trials: Trial[]; failed: boolean };

/** Diario delle prove, sempre aggiornato. Non lancia mai errori (vedi useFlourArchive). */
export function useTrials(): { trials: Trial[]; loaded: boolean; failed: boolean } {
  const result = useLiveQuery<Result>(
    () =>
      trialRepository
        .list()
        .then((trials) => ({ trials, failed: false }))
        .catch(() => ({ trials: EMPTY, failed: true })),
    [],
  );
  if (!result) return { trials: EMPTY, loaded: false, failed: false };
  return { trials: result.trials, loaded: true, failed: result.failed };
}

/** Una prova; undefined mentre carica, null se non esiste. */
export function useTrial(id: string | undefined): Trial | null | undefined {
  return useLiveQuery(
    () => (id ? trialRepository.get(id).then((t) => t ?? null).catch(() => null) : Promise.resolve(null)),
    [id],
  );
}

export const saveTrial = (t: Trial) => trialRepository.save(t);
export const removeTrial = (id: string) => trialRepository.remove(id);

/**
 * Aggiorna una prova partendo dalla versione salvata ADESSO (non da una copia vecchia in memoria):
 * se nel frattempo è stata modificata, non perdiamo le modifiche. null se la prova non c'è più.
 */
export async function updateTrial(id: string, change: (t: Trial) => Trial): Promise<Trial | null> {
  const current = await trialRepository.get(id);
  return current ? trialRepository.save(change(current)) : null;
}
