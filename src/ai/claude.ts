import Anthropic from "@anthropic-ai/sdk";

/*
  Chiamata a Claude dal telefono, con la chiave del pizzaiolo.
  - dangerouslyAllowBrowser: l'SDK di solito vieta le chiamate dal browser perché la chiave
    sarebbe visibile. Qui è voluto: la chiave è del pizzaiolo e resta sul suo telefono.
  - streaming: la risposta compare mentre viene scritta, senza lunghe attese a schermo vuoto.
  - fallbacks "default": se il modello rifiuta una richiesta, l'API la ripassa da sola a un modello di riserva.
*/

export const ADVICE_MODEL = "claude-opus-5-5";

const ROLE = `Sei un tecnologo dei lievitati esperto di pizza (napoletana, teglia, pala) e pane, al servizio di un pizzaiolo professionista.
I dati arrivano dall'app Lievora: ricette calcolate, farine con scheda tecnica, temperature misurate, voti da 1 a 5 e commenti delle prove.`;

const STYLE = `Come rispondere:
- In italiano, come parleresti a un collega in laboratorio: diretto e pratico.
- Ogni punto su una riga che inizia con "- ". Niente tabelle, titoli o grassetto.
- Dai numeri concreti (grammi, %, ore, °C) quando suggerisci una modifica, e spiega in mezza frase il perché.
- Basati sui dati ricevuti: se manca un dato importante, dillo e suggerisci di inserirlo. Non inventare valori di schede tecniche.
- Una sola modifica importante alla volta vale più di cinque piccole: così il pizzaiolo capisce cosa ha funzionato.`;

const SYSTEMS = {
  /** consiglio sull'impasto di oggi (scheda Risultati) */
  dough: `${ROLE}
Ricevi l'impasto di oggi e le ultime prove valutate del diario.

${STYLE}
- Al massimo 5 punti.
- Se le prove del diario mostrano un problema ricorrente, collegalo alla causa più probabile.
- Se l'impasto va bene così, dillo senza cercare per forza qualcosa da cambiare.`,

  /** feedback su una prova appena valutata (pagina della prova) */
  trial: `${ROLE}
Ricevi UNA prova completa (ricetta di quel giorno, temperature misurate, note, voti, commento) e le prove precedenti per confronto.

${STYLE}
- Rispondi con esattamente 3 punti, in quest'ordine:
  - la causa più probabile del voto più basso (o del problema scritto nel commento), collegata ai dati;
  - cosa cambiare nella prossima prova, con i numeri;
  - cosa tenere uguale perché ha funzionato.
- Se le prove precedenti mostrano lo stesso problema, dillo: è un indizio forte.
- Se i voti sono tutti alti, dillo e suggerisci al massimo una prova per migliorare ancora.`,
} as const;

export type AdviceKind = keyof typeof SYSTEMS;

export type AdviceResult = { text: string; model: string; refused: boolean; truncated: boolean };

export async function streamAdvice(opts: {
  kind: AdviceKind;
  apiKey: string;
  /** il fascicolo con i dati (vedi domain/consiglio.ts) */
  context: string;
  question: string;
  onText: (delta: string) => void;
  signal?: AbortSignal;
}): Promise<AdviceResult> {
  const client = new Anthropic({ apiKey: opts.apiKey, dangerouslyAllowBrowser: true });

  const stream = client.beta.messages.stream(
    {
      model: ADVICE_MODEL,
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      // consiglio breve e pratico: "medium" basta (è anche il default di questo modello, lo scriviamo esplicito)
      output_config: { effort: "medium" },
      system: SYSTEMS[opts.kind],
      messages: [{ role: "user", content: `${opts.context}\n\n# Domanda del pizzaiolo\n${opts.question}` }],
    },
    { signal: opts.signal },
  );
  stream.on("text", opts.onText);

  const message = await stream.finalMessage();
  const text = message.content
    .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
    .map((b) => b.text)
    .join("");
  return {
    text,
    // con un fallback può aver risposto un altro modello: salviamo quello vero
    model: message.model,
    refused: message.stop_reason === "refusal",
    truncated: message.stop_reason === "max_tokens",
  };
}

/** Messaggio leggibile per il pizzaiolo, dal tipo di errore dell'SDK (mai dal testo dell'errore). */
export function adviceErrorMessage(err: unknown): string {
  if (err instanceof Anthropic.APIUserAbortError) return "Richiesta fermata.";
  if (err instanceof Anthropic.AuthenticationError) return "La chiave non è valida: controllala o creane una nuova.";
  if (err instanceof Anthropic.PermissionDeniedError) return "Questa chiave non ha il permesso di usare Claude.";
  if (err instanceof Anthropic.RateLimitError) return "Troppe richieste in poco tempo: riprova tra un minuto.";
  if (err instanceof Anthropic.BadRequestError)
    return `Anthropic ha rifiutato la richiesta (spesso: credito esaurito sull'account). Dettaglio: ${err.message}`;
  if (err instanceof Anthropic.APIConnectionError) return "Nessuna connessione: serve internet per chiedere un consiglio.";
  if (err instanceof Anthropic.APIError) return `Errore del servizio (${err.status ?? "?"}): riprova più tardi.`;
  return "Qualcosa è andato storto: riprova.";
}
