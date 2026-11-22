# domain

Il cuore dell'app: **tipi e calcoli puri**, senza React, senza database, senza telefono.

Una funzione qui riceve dati e restituisce un risultato, sempre lo stesso a parità di input.
Per questo si testa facilmente: ogni file `x.ts` ha accanto il suo `x.test.ts` (Vitest).

File previsti:

- `impasto.ts`: idratazione totale, percentuali del panettiere, porzionatura
- `lievito.ts`: ore equivalenti a 24 °C, dose di lievito consigliata
- `temperature.ts`: temperatura dell'acqua
- `prova.ts`: il modello di una prova del diario (schema Zod + tipo)

Le formule di partenza sono in `legacy/index.html`, nella funzione `calc()`.
