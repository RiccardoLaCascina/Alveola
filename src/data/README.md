# data

Dove vivono i dati salvati sul telefono.

- `legacyDraft.ts`: importa la bozza salvata dalla prima versione (`banco-impasti-bozza`), così chi la usava ritrova il suo impasto.
- In arrivo: `db.ts` (IndexedDB con Dexie) e `proveRepository.ts` per il diario delle prove.

La bozza dell'impasto in lavorazione è gestita da `src/state/doughStore.ts` (Zustand, salvata in localStorage
con la chiave `alveola-impasto-bozza` e validata con lo schema Zod a ogni avvio).
