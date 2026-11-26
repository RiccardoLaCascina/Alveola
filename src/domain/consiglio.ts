import type { Dough } from "./model";
import { analyzeDough, type DoughAnalysis } from "./analisi";
import { RATING_KEYS, RATING_LABELS, doughTempDeviation, type Trial } from "./prova";
import { usageLabel } from "./miscela";
import { MIXERS, PREFERMENT_PRESETS } from "./presets";
import { fmt, fmtGrams, percent } from "./format";

/*
  I "fascicoli" da mandare a Claude: testo semplice, a sezioni con titolo.
  Funzioni pure: dagli stessi dati esce sempre lo stesso testo (facili da testare e da leggere).
  Solo numeri e fatti già calcolati dall'app: Claude ragiona su quelli, non li ricalcola da zero.

  Due usi:
  - buildAdviceContext: l'impasto di oggi + le ultime prove (scheda Risultati, "Chiedi a Claude");
  - buildTrialFeedbackContext: UNA prova completa + le precedenti per confronto (pagina della prova).
*/

/** Quante prove valutate mandiamo per confronto, dalla più recente. */
export const MAX_TRIALS_IN_CONTEXT = 5;

const YEAST_LABEL: Record<Dough["yeastType"], string> = {
  fresh: "lievito di birra fresco",
  dry: "lievito di birra secco",
  none: "nessun lievito di birra",
};

/**
 * Descrizione completa di un impasto: ricetta, farine, maturazione, temperature previste, avvisi.
 * `today`: true per l'impasto di oggi (aggiunge gli avvisi di pianificazione, che parlano di "oggi").
 */
function doughSections(d: Dough, a: DoughAnalysis, today: boolean): string[] {
  const c = a.composition;
  const out: string[] = [];
  const add = (s = "") => out.push(s);
  const pctOnFlour = (g: number) => `${fmt(percent(g, c.totalFlour), 1)} %`;

  add("## Ricetta");
  add(`- Farina totale ${fmt(c.totalFlour)} g, acqua totale ${fmt(c.totalWater)} g → idratazione ${fmt(c.hydration, 1)} %`);
  add(`- Sale ${fmtGrams(c.salt)} g (${pctOnFlour(c.salt)})${c.fat > 0 ? `, olio/grassi ${fmtGrams(c.fat)} g (${pctOnFlour(c.fat)})` : ""}`);
  add(`- In vasca: ${YEAST_LABEL[d.yeastType]}${c.yeastRaw ? ` ${fmtGrams(c.yeastRaw)} g` : ""}`);
  add(`- Peso impasto ${fmt(c.totalWeight)} g${a.portion ? `, ${a.portion.pieces} panetti da ${fmt(d.pieceWeight ?? 0)} g` : ""}`);
  for (const p of c.preferments) {
    const pf = d.preferments.find((x) => x.id === p.id);
    const name = pf ? PREFERMENT_PRESETS[pf.type].label : "Prefermento";
    add(`- ${name}: ${fmt(p.flour)} g farina + ${fmt(p.water)} g acqua${p.yeast ? `, lievito ${fmtGrams(p.yeast)} g` : ""}`);
  }
  add(`- Impastatrice: ${MIXERS[d.mixer].label}`);

  add();
  add("## Farine");
  const f = a.flours;
  if (f.distribution.usages.length) {
    for (const u of f.distribution.usages) {
      const fl = u.flour;
      const specs = fl
        ? [
            fl.w && `W ${fl.w}`,
            fl.pl && `P/L ${fmt(fl.pl, 2)}`,
            fl.protein && `proteine ${fmt(fl.protein, 1)} % (${fl.proteinBasis === "ss" ? "su sostanza secca" : "tal quale"})`,
            fl.absorption && `assorbimento ${fmt(fl.absorption, 0)} %`,
          ]
            .filter(Boolean)
            .join(", ")
        : "";
      add(`- ${usageLabel(u)}${specs ? ` — ${specs}` : ""}`);
    }
  } else add("- Miscela non indicata.");
  if (f.effectiveW.value) add(`- W della miscela usata nei controlli: ${fmt(f.effectiveW.value)}`);
  if (f.profile.absorption) add(`- Assorbimento medio della miscela: ${fmt(f.profile.absorption.value, 0)} %`);

  add();
  add("## Maturazione");
  for (const p of a.maturation.phases) add(`- ${p.name}: ${fmt(p.hours, 1)} h a ${fmt(p.temp, 0)} °C${p.balled ? " (in panetti)" : ""}`);
  add(`- Totale ${fmt(a.maturation.totalHours, 1)} h, pari a circa ${fmt(a.maturation.equivalentHours, 1)} h a 24 °C`);
  if (a.recommendedW) add(`- W consigliata per questi tempi: ${a.recommendedW.min}–${a.recommendedW.max} (${a.recommendedW.label})`);
  if (a.yeast) add(`- Lievito fresco stimato dall'app: ${fmtGrams(a.yeast.freshGrams)} g (${fmt(a.yeast.percent, 2)} % sulla farina)`);

  add();
  add("## Temperature previste");
  if (d.targetDoughTemp != null) add(`- Temperatura finale impasto voluta: ${fmt(d.targetDoughTemp, 0)} °C`);
  if (d.flourTemp != null) add(`- Farina: ${fmt(d.flourTemp, 0)} °C`);
  if (a.waterTemp != null) add(`- Acqua consigliata dall'app: ${fmt(a.waterTemp, 0)} °C`);
  if (d.ambientTemp != null) add(`- Laboratorio: ${fmt(d.ambientTemp, 0)} °C`);
  if (d.ambientHumidity != null) add(`- Umidità: ${fmt(d.ambientHumidity, 0)} %`);

  const flags = [...a.compositionFlags, ...f.flags, ...a.maturationFlags, ...(today ? a.planningFlags : [])];
  if (flags.length) {
    add();
    add("## Avvisi dell'app");
    for (const fl of flags) add(`- ${fl.message}`);
  }
  return out;
}

/** Misure reali, note, voti e commento di una prova: quello che è successo davvero. */
function trialOutcome(t: Trial): string[] {
  const out: string[] = [];
  const m = t.measured;
  const temps = [
    m.waterTemp != null && `acqua ${fmt(m.waterTemp, 0)} °C`,
    m.doughTemp != null && `impasto a fine lavorazione ${fmt(m.doughTemp, 1)} °C`,
    m.ambientTemp != null && `laboratorio ${fmt(m.ambientTemp, 0)} °C`,
    m.ambientHumidity != null && `umidità ${fmt(m.ambientHumidity, 0)} %`,
  ].filter(Boolean);
  if (temps.length) out.push(`- Misurato: ${temps.join(", ")}`);
  const dev = doughTempDeviation(t);
  if (dev != null && Math.abs(dev) >= 1) out.push(`- Impasto ${dev > 0 ? "più caldo" : "più freddo"} di ${fmt(Math.abs(dev), 1)} °C rispetto al voluto`);
  if (t.mixingNotes) out.push(`- Note all'impasto: ${t.mixingNotes}`);
  const votes = RATING_KEYS.filter((k) => t.ratings[k] != null).map((k) => `${RATING_LABELS[k].label} ${t.ratings[k]}/5`);
  if (votes.length) out.push(`- Voti: ${votes.join("; ")}`);
  if (t.comment) out.push(`- Commento dopo la cottura: ${t.comment}`);
  return out;
}

/** Prova di confronto in poche righe: numeri chiave + com'è andata. */
function trialShortLines(t: Trial): string[] {
  const s = t.summary;
  const when = new Date(t.createdAt).toLocaleDateString("it-IT");
  const pf = t.dough.preferments.map((p) => PREFERMENT_PRESETS[p.type].label.toLowerCase());
  const nums = [
    s.hydration != null && `idratazione ${fmt(s.hydration, 1)} %`,
    s.totalHours != null && `${fmt(s.totalHours, 0)} h di maturazione`,
    s.effectiveW != null && `W ${fmt(s.effectiveW)}`,
    pf.length > 0 && pf.join(" + "),
  ]
    .filter(Boolean)
    .join(", ");
  return [`- ${when}${t.title ? ` «${t.title}»` : ""}: ${nums}`, ...trialOutcome(t).map((l) => `  ${l}`)];
}

/** Prove valutate da usare come confronto: più recenti prima; esclude `exceptId` e (se dato) quelle dopo `before`. */
function previousRated(trials: Trial[], exceptId?: string, before?: number): Trial[] {
  return trials
    .filter((t) => t.status === "done" && t.id !== exceptId && (before == null || t.createdAt < before))
    .sort((x, y) => y.createdAt - x.createdAt)
    .slice(0, MAX_TRIALS_IN_CONTEXT);
}

/** Impasto di oggi + ultime prove valutate. */
export function buildAdviceContext(d: Dough, a: DoughAnalysis, trials: Trial[] = []): string {
  const lines = ["# Impasto di oggi", "", ...doughSections(d, a, true)];
  const rated = previousRated(trials);
  if (rated.length) {
    lines.push("", "# Ultime prove valutate (dalla più recente)");
    for (const t of rated) lines.push(...trialShortLines(t));
  }
  return lines.join("\n");
}

/** Una prova completa (la ricetta com'era quel giorno + com'è andata) e le prove valutate fatte PRIMA, per confronto. */
export function buildTrialFeedbackContext(trial: Trial, allTrials: Trial[] = []): string {
  const a = analyzeDough(trial.dough, trial.flours);
  const when = new Date(trial.createdAt).toLocaleDateString("it-IT");
  const lines = [`# Prova da analizzare: ${when}${trial.title ? ` «${trial.title}»` : ""}`, "", ...doughSections(trial.dough, a, false)];
  lines.push("", "## Com'è andata", ...trialOutcome(trial));
  const previous = previousRated(allTrials, trial.id, trial.createdAt);
  lines.push("", "# Prove precedenti per confronto (dalla più recente)");
  if (previous.length) for (const t of previous) lines.push(...trialShortLines(t));
  else lines.push("- Nessuna: è la prima prova valutata.");
  return lines.join("\n");
}
