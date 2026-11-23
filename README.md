# Lievora

> *Ogni impasto ha il suo tempo.*

Il diario di laboratorio del pizzaiolo: ogni giorno registra la prova d'impasto, la confronta con le precedenti e aiuta a rendere l'impasto costante.
Pensata per pizzerie, ristoranti, pizza al taglio e alla pala. Si usa dal telefono (PWA installabile, più avanti anche APK Android).

## Cosa fa (e farà)

- **Impasto**: farina, acqua, sale, grassi, lievito, prefermenti (biga, poolish, lievito madre).
- **Tempi**: fasi di maturazione con durata e temperatura, ognuna segnabile "a temperatura ambiente" e "in panetti";
  ambiente di oggi (temperatura e umidità del laboratorio) con due strategie di costanza: **adatta il lievito**
  (tempi fissi, cambia la dose) o **adatta i tempi** (lievito fisso, puntata e appretto si allungano o accorciano
  perché la maturazione valga lo stesso); **programma all'indietro**: dall'ora in cui vuoi l'impasto pronto calcola
  a che ora impastare e a che ora fare lo **staglio**. Temperature di impastamento, forza della farina (W).
- **Risultati**: idratazione, percentuali del panettiere, lievito consigliato, temperatura dell'acqua, programma orario.
- **Farine**: archivio delle farine (nome, molino, tipo, W, P/L, proteine, assorbimento, note) e miscele in percentuale,
  sia per l'impasto in vasca sia per ogni prefermento. In Risultati: W, P/L, proteine e assorbimento della miscela
  (media pesata sui grammi), ripartizione tra vasca e prefermenti, avvisi (quote, dati mancanti, acqua rispetto all'assorbimento).
  La W della miscela sostituisce quella scritta a mano solo se copre tutta la farina; altrimenti le due si combinano.
- **Diario**: la prova si registra in due momenti. All'impasto: fotografia completa di ricetta, farine e programma
  + temperature misurate (acqua, impasto a fine lavorazione, laboratorio, umidità). Dopo la cottura: voto da 1 a 5 su
  estensibilità e lavorabilità, sviluppo del cornicione, alveolatura, cottura e croccantezza, e commento.
  "Rifai questo impasto oggi" riporta la ricetta di una prova nella bozza del giorno.
- **In arrivo**: confronto tra prove; AI con la chiave del pizzaiolo, che interroga tutti i dati e cresce con lui
  (memoria locale delle prove e delle correzioni).

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
| Dati sul telefono | IndexedDB con Dexie: archivio farine e diario delle prove |
| Validazione dati | Zod |
| Test | Vitest |

## Struttura

```
src/
├─ domain/      tipi e calcoli puri (niente React): impasto, lievito, temperature, farina, miscela, programma, prova
├─ state/       stato condiviso tra le schede (Zustand) e accesso reattivo al database
├─ data/        database (Dexie), repository di farine e prove, migrazioni dei dati salvati
├─ features/    una cartella per scheda: impasto, tempi, risultati, farine, diario (caricate solo quando servono)
├─ components/  pezzi di interfaccia condivisi
│  └─ ui/       componenti shadcn/ui (button, card, input, select, slider, dialog, ...)
├─ lib/         utilità (cn per unire classi Tailwind)
├─ app/         layout, barra delle schede, router, tema chiaro/scuro
└─ styles/      tema Lievora (colori, font, variabili per chiaro e scuro)
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

Una volta sola, su GitHub:
1. **Settings → General → Danger Zone → Change visibility → Public** (con l'account gratuito Pages non funziona sui privati).
2. **Settings → Pages → Build and deployment → Source: GitHub Actions** (non "Deploy from a branch": la nuova app va compilata).

Poi ogni volta: porta il lavoro su `main` (merge o pull request) e fai push; la scheda **Actions** mostra la pubblicazione.

Indirizzo: `https://riccardolacascina.github.io/<nome-repository>/` (oggi il repository si chiama `Alveola`;
se lo rinomini in `Lievora` da Settings → General, l'indirizzo diventa `.../Lievora/`).
Sul telefono: **iPhone** Condividi → Aggiungi alla schermata Home; **Android** menu ⋮ → Installa app.

## Verifiche

- `npm test`: test del dominio, compresa la **parità esatta** con la prima versione su 5 impasti.
- `node scripts/smoke-mobile.mjs <url> <porta-debug> <cartella>`: apre l'app in Edge/Chrome headless come un iPhone,
  prova le interazioni principali (scrivere, aggiungere una biga, "Usa questa dose", ricarica) e salva gli screenshot.

## Modelli di calcolo nuovi

- **Fasi ambiente**: con la temperatura di oggi, "adatta i tempi" usa `ore × attività(prevista) / attività(oggi)`:
  le ore equivalenti a 24 °C, e quindi la dose di lievito, restano quelle della ricetta.
- **Staglio**: è l'inizio della prima fase segnata "in panetti". Gli orari del programma sono arrotondati al minuto.
- **Umidità**: non cambia in modo misurabile la velocità del lievito; l'app la usa per consigli sulla superficie
  dei panetti (pelle o appiccicosità) e sull'acqua.
- **Proteine**: quelle "su s.s." sono riportate a tal quale con umidità tipica 14,5 % prima della media.

## Modelli di calcolo (dalla prima versione)

- **Lievito**: ogni fase è convertita in ore equivalenti a 24 °C (l'attività del lievito raddoppia circa ogni 7 °C); dose di lievito fresco `3,87 × ore^-1,37` %. Punto di partenza da tarare con le prove.
- **Temperatura dell'acqua**: bilancio termico tra farina (calore specifico ≈ 0,4 dell'acqua), acqua e prefermenti, più il riscaldamento dell'impastatrice.
- **Forza della farina**: fasce indicative di W in base alla durata totale.
