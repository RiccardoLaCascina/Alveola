# data

Dove vivono i dati salvati sul telefono.

- `db.ts`: database del telefono (IndexedDB con Dexie). Nome `lievora`; versione 1: tabella `flours`. Al primo avvio sposta i dati dal vecchio database `alveola`.
- `flourRepository.ts`: archivio farine (elenco, lettura, salvataggio con validazione Zod, eliminazione). Testato con `fake-indexeddb`.
- `legacyDraft.ts`: importa la bozza salvata dalla prima versione (`banco-impasti-bozza`), così chi la usava ritrova il suo impasto.
- In arrivo: `proveRepository.ts` per il diario delle prove (nuova `.version(2)` in `db.ts`).

Se IndexedDB non è disponibile (navigazione privata, memoria piena) l'app resta usabile: l'archivio risulta non disponibile
e lo dice, invece di bloccarsi (`src/state/flours.ts`).

La bozza dell'impasto in lavorazione è gestita da `src/state/doughStore.ts` (Zustand, salvata in localStorage
con la chiave `lievora-impasto-bozza` e validata con lo schema Zod a ogni avvio).
