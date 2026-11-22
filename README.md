# Banco impasti

App per telefono (PWA) per gestire impasti, prefermenti e maturazione.

## Cosa fa

- **Impasto**: farina, acqua, sale, grassi, lievito di birra fresco o secco, prefermenti (biga, poolish, lievito madre solido e liquido).
- **Tempi**: fasi di maturazione con durata e temperatura, temperature di impastamento, forza della farina (W), ora di inizio.
- **Risultati**: idratazione totale, percentuali del panettiere, porzionatura, lievito consigliato, temperatura dell'acqua, W consigliata e programma orario.

I dati restano salvati sul telefono (localStorage). Dopo la prima apertura l'app funziona anche offline.

## Struttura

```
index.html             interfaccia e logica dell'app
manifest.webmanifest   nome, icone e colori per l'installazione
sw.js                  service worker per l'uso offline
icons/                 icone dell'app
```

## Provarla sul telefono

1. Pubblica il repository con GitHub Pages (Settings → Pages → branch `main`, cartella `/root`).
2. Apri `https://<tuo-utente>.github.io/banco-impasti/` sul telefono.
3. **iPhone (Safari)**: Condividi → Aggiungi alla schermata Home.
   **Android (Chrome)**: menu ⋮ → Installa app.

## Provarla sul computer

```
python3 -m http.server 8000
```

poi apri http://localhost:8000.

## Pubblicare una nuova versione

1. Modifica i file.
2. In `sw.js` aumenta `VERSION` (es. da `v1` a `v2`).
3. `git add . && git commit -m "descrizione" && git push`

## Modelli di calcolo

- **Lievito**: ogni fase è convertita in ore equivalenti a 24 °C (l'attività del lievito raddoppia circa ogni 7 °C); la dose di lievito fresco segue una curva empirica `3,87 × ore^-1,37` %. È un punto di partenza da tarare con le prove.
- **Temperatura dell'acqua**: bilancio termico tra farina (calore specifico ≈ 0,4 dell'acqua), acqua e prefermenti, più il riscaldamento dell'impastatrice.
- **Forza della farina**: fasce indicative di W in base alla durata totale.
