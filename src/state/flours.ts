import { useLiveQuery } from "dexie-react-hooks";
import type { Flour } from "@/domain/model";
import { flourRepository } from "@/data/flourRepository";

const EMPTY: Flour[] = [];

type ArchiveResult = { flours: Flour[]; failed: boolean };
const FAILED: ArchiveResult = { flours: EMPTY, failed: true };

export type FlourArchive = {
  flours: Flour[];
  /** false finché il database non ha risposto: l'archivio non è "vuoto", è "ancora da leggere" */
  loaded: boolean;
  /** il database del telefono non è disponibile (es. navigazione privata o spazio esaurito) */
  failed: boolean;
};

/**
 * Archivio farine, sempre aggiornato: quando una farina viene salvata o eliminata
 * tutti i componenti che lo usano si ridisegnano.
 * Non lancia mai errori: se IndexedDB non funziona l'app resta usabile, con l'archivio vuoto e `failed`.
 */
export function useFlourArchive(): FlourArchive {
  const result = useLiveQuery<ArchiveResult>(
    () =>
      flourRepository
        .list()
        .then((flours) => ({ flours, failed: false }))
        .catch(() => FAILED),
    [],
  );
  if (!result) return { flours: EMPTY, loaded: false, failed: false };
  return { flours: result.flours, loaded: true, failed: result.failed };
}

export const saveFlour = (f: Flour) => flourRepository.save(f);
export const removeFlour = (id: string) => flourRepository.remove(id);
