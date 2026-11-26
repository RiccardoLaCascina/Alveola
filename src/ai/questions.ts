// Domande predefinite. Stanno qui e non in claude.ts: importare da claude.ts trascinerebbe
// l'SDK di Anthropic nel bundle principale (lo vogliamo caricare solo alla prima richiesta).

export const DEFAULT_QUESTION = "Controlla questo impasto: cosa cambieresti, se qualcosa, per un risultato migliore?";
export const TRIAL_QUESTION = "Com'è andata questa prova e cosa cambio la prossima volta?";
