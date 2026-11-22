# Alveola

Il diario di laboratorio del pizzaiolo: ogni giorno registra la prova d'impasto, la confronta con le precedenti e aiuta a rendere l'impasto costante.
Pensata per pizzerie, ristoranti, pizza al taglio e alla pala. Si usa dal telefono (PWA installabile, più avanti anche APK Android).

## Cosa fa (e farà)

- **Impasto**: farina, acqua, sale, grassi, lievito, prefermenti (biga, poolish, lievito madre).
- **Tempi**: fasi di maturazione con durata e temperatura, temperature di impastamento, forza della farina (W).
- **Risultati**: idratazione, percentuali del panettiere, lievito consigliato, temperatura dell'acqua, programma orario.
- **Farine**: archivio delle farine (nome, molino, tipo, W, P/L, proteine, assorbimento, note) e miscele in percentuale,
  sia per l'impasto in vasca sia per ogni prefermento. In Risultati: W, P/L, proteine e assorbimento della miscela
  (media pesata sui grammi), ripartizione tra vasca e prefermenti, avvisi (quote, dati mancanti, acqua rispetto all'assorbimento).
  La W della miscela sostituisce quella scritta a mano solo se copre tutta la farina; altrimenti le due si combinano.
- **Diario**: ogni prova con temperature misurate (acqua, impasto finale, ambiente), esito da 1 a 5 su più voci e commento.
- **In arrivo**: diario delle prove; pianificazione all'indietro (a che ora impastare e fare lo staglio per arrivare
  all'orario voluto, con temperatura e umidità dell'ambiente); AI con la chiave del pizzaiolo, che interroga tutti i dati
  e cresce con lui (memoria locale delle prove e delle correzioni).

## Tecnologie

| | |
|---|---|
| Linguaggio | TypeScript |
| Interfaccia | React |
| Stile | Tailwind CSS v4 |
| Componenti | shadcn/ui (su Radix UI): accessibili, copiati in `src/components/ui/` e modificabili |
| Icone | Lucide |
| Animazioni | Motion |
| Font | Bricolage Grotesque (titoli), Geist (testo), inclusi nell'app per l'uso offline |
| Build e server di sviluppo | Vite |
| App installabile / offline | vite-plugin-pwa |
| Navigazione | React Router (HashRouter) |
| Stato | Zustand (bozza salvata in localStorage) |
| Dati sul telefono | IndexedDB con Dexie (per il diario) |
| Validazione dati | Zod |
| Test | Vitest |

## Struttura

```
src/
├─ domain/      tipi e calcoli puri (niente React): impasto, lievito, temperature, farina, programma
├─ state/       stato condiviso tra le schede (Zustand), salvato sul telefono
├─ data/        dati salvati: import dalla prima versione, poi database (Dexie)
├─ features/    una cartella per scheda: impasto, tempi, risultati, diario
├─ components/  pezzi di interfaccia condivisi
│  └─ ui/       componenti shadcn/ui (button, card, input, select, slider, dialog, ...)
├─ lib/         utilità (cn per unire classi Tailwind)
├─ app/         layout, barra delle schede, router, tema chiaro/scuro
└─ styles/      tema Alveola (colori, font, variabili per chiaro e scuro)
public/icons/   icone dell'app
legacy/         la prima versione in un solo file (riferimento per il test di parità)
scripts/        strumenti: cattura dei valori della prima versione, prova di fumo su telefono emulato
```

Percorso di ogni funzione: **componente → hook/store → dominio** (calcoli) e **store → data** (salvataggio).

## Comandi

Una volta sola, dopo aver clonato:

```
npm install
```

Poi:

| Comando | Cosa fa |
|---|---|
| `npm run dev` | avvia l'app su http://localhost:5173 con ricarica automatica |
| `npm test` | esegue i test una volta |
| `npm run test:watch` | riesegue i test a ogni modifica |
| `npm run typecheck` | controlla i tipi TypeScript |
| `npm run build` | crea la versione da pubblicare in `dist/` |
| `npm run preview` | prova in locale la versione di `dist/` |

Nel browser, con F12 e poi Ctrl+Shift+M, puoi simulare lo schermo di un telefono.

## Interfaccia

- Tema in `src/styles/global.css`: chiaro "farina" e scuro "laboratorio di sera", con primary crosta dorata.
  Colori di dominio pronti come classi Tailwind: `bg-flour`, `bg-water`, `bg-preferment`, `bg-cold`, `bg-mild`, `bg-warm`.
- Nuovi componenti shadcn: `npx shadcn@latest add <nome>` (es. `tabs`, `chart`, `drawer`).
- Import con alias: `@/components/...` invece di `../../components/...`.

## Rami

- `development`: qui si integra il lavoro.
- `feature/...`: un ramo per ogni funzione, poi unito su `development`.
- `main`: versione stabile; ogni push su `main` la pubblica.

## Pubblicazione su GitHub Pages

Il workflow `.github/workflows/deploy.yml` esegue test e build e pubblica `dist/` a ogni push su `main`.

Una volta sola, su GitHub: **Settings → Pages → Source: GitHub Actions**.
Il repository deve essere pubblico (con l'account gratuito Pages non funziona sui privati).

Indirizzo: `https://riccardolacascina.github.io/Alveola/`
Sul telefono: **iPhone** Condividi → Aggiungi alla schermata Home; **Android** menu ⋮ → Installa app.

## Verifiche

- `npm test`: test del dominio, compresa la **parità esatta** con la prima versione su 5 impasti.
- `node scripts/smoke-mobile.mjs <url> <porta-debug> <cartella>`: apre l'app in Edge/Chrome headless come un iPhone,
  prova le interazioni principali (scrivere, aggiungere una biga, "Usa questa dose", ricarica) e salva gli screenshot.

## Modelli di calcolo (dalla prima versione)

- **Lievito**: ogni fase è convertita in ore equivalenti a 24 °C (l'attività del lievito raddoppia circa ogni 7 °C); dose di lievito fresco `3,87 × ore^-1,37` %. Punto di partenza da tarare con le prove.
- **Temperatura dell'acqua**: bilancio termico tra farina (calore specifico ≈ 0,4 dell'acqua), acqua e prefermenti, più il riscaldamento dell'impastatrice.
- **Forza della farina**: fasce indicative di W in base alla durata totale.
