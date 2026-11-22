# domain

Il cuore dell'app: **tipi e calcoli puri**, senza React, senza database, senza telefono.
Una funzione qui riceve dati e restituisce un risultato, sempre lo stesso a parità di input: per questo si testa facilmente.

| File | Contenuto |
|---|---|
| `model.ts` | schema Zod dell'impasto (ingredienti, prefermenti, fasi, temperature) e tipi ricavati |
| `presets.ts` | valori tipici: prefermenti, impastatrici, fasi, impasto di esempio |
| `impasto.ts` | composizione: farina/acqua dei prefermenti, idratazione, percentuali del panettiere, panetti, avvisi |
| `lievito.ts` | attività del lievito con la temperatura, ore equivalenti a 24 °C, dose consigliata |
| `temperature.ts` | temperatura dell'acqua (bilancio termico) |
| `farina.ts` | forza (W) consigliata e confronto con la farina usata |
| `miscela.ts` | miscele di farine: grammi di ogni farina tra vasca e prefermenti, profilo pesato (W, P/L, proteine, assorbimento), W effettiva, avvisi |
| `programma.ts` | programma orario delle fasi |
| `analisi.ts` | `analyzeDough()`: mette insieme tutto, è quello che usano le schede |
| `format.ts` | numeri in formato italiano |

## Test

- Ogni modulo ha il suo `*.test.ts`.
- `parita.test.ts` confronta il dominio con la **prima versione** (`legacy/index.html`): i risultati che mostrava
  per 5 impasti diversi sono in `__fixtures__/legacy-parity.json`, catturati con `scripts/capture-legacy.mjs`.
  Se si cambia una formula di proposito, si aggiornano i valori attesi.
