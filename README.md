# Alveola

App per telefono (PWA) per gestire impasti, prefermenti, maturazione e lievitazione.

## Cosa fa

- **Impasto**: farina, acqua, sale, grassi, lievito di birra fresco o secco, prefermenti (biga, poolish, lievito madre solido e liquido).
- **Tempi**: fasi di maturazione con durata e temperatura, temperature di impastamento, forza della farina (W), ora di inizio.
- **Risultati**: idratazione totale, percentuali del panettiere, porzionatura, lievito consigliato, temperatura dell'acqua, W consigliata e programma orario.

I dati restano salvati sul telefono (localStorage). Dopo la prima apertura l'app funziona anche offline.

## Tecnologia

HTML, CSS e JavaScript puri, senza framework né librerie. Il manifest e il service worker la rendono una PWA, cioè un sito che il telefono può installare come un'app.

## Struttura

```
index.html             interfaccia e logica dell'app
manifest.webmanifest   nome, icone e colori per l'installazione
sw.js                  service worker per l'uso offline
icons/                 icone dell'app
```

## Rami

- `development`: qui si lavora.
- `main`: versione stabile, pubblicata con GitHub Pages.

Quando una modifica su `development` funziona, si porta su `main` (merge o pull request).

## Provarla sul computer

Dalla cartella del progetto:

```
python -m http.server 8000
```

poi apri http://localhost:8000. Nel browser, con gli strumenti per sviluppatori (F12), puoi simulare lo schermo di un telefono.

## Provarla sul telefono

1. Il repository deve essere pubblico (con l'account gratuito GitHub Pages non funziona sui privati).
2. Attiva GitHub Pages: Settings → Pages → branch `main`, cartella `/ (root)`, Save.
3. Dopo un paio di minuti apri `https://riccardolacascina.github.io/Alveola/` sul telefono.
4. **iPhone (Safari)**: Condividi → Aggiungi alla schermata Home.
   **Android (Chrome)**: menu ⋮ → Installa app.

## Pubblicare una nuova versione

1. Modifica i file su `development` e provali in locale.
2. In `sw.js` aumenta `VERSION` (es. da `v1` a `v2`), così i telefoni scaricano la versione nuova.
3. Commit e push:
   ```
   git add .
   git commit -m "descrizione"
   git push
   ```
4. Porta le modifiche su `main` per pubblicarle.

## Modelli di calcolo

- **Lievito**: ogni fase è convertita in ore equivalenti a 24 °C (l'attività del lievito raddoppia circa ogni 7 °C); la dose di lievito fresco segue una curva empirica `3,87 × ore^-1,37` %. È un punto di partenza da tarare con le prove.
- **Temperatura dell'acqua**: bilancio termico tra farina (calore specifico ≈ 0,4 dell'acqua), acqua e prefermenti, più il riscaldamento dell'impastatrice.
- **Forza della farina**: fasce indicative di W in base alla durata totale.

## Prossimi passi

- Diario delle prove: registrare ogni impasto e com'è andato, per tarare le stime sui propri risultati.
- Effetto di sale, zuccheri e grassi sulla velocità di lievitazione.
- App Android (APK) con Capacitor.
