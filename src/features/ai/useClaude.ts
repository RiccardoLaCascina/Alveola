import { useRef, useState } from "react";
import { clearApiKey, readApiKey } from "@/ai/apiKey";
import type { AdviceKind, AdviceResult } from "@/ai/claude";

/** La chiave salvata sul telefono, con le funzioni per impostarla e toglierla. */
export function useClaudeKey() {
  const [apiKey, setApiKey] = useState(readApiKey);
  const forget = () => {
    clearApiKey();
    setApiKey("");
  };
  return { apiKey, setApiKey, forget };
}

type AskInput = { kind: AdviceKind; apiKey: string; context: string; question: string };

/**
 * Una richiesta a Claude con la risposta che arriva a pezzi (streaming).
 * - answer: il testo arrivato finora;
 * - note: errore o avviso da mostrare (chiave sbagliata, risposta rifiutata o tagliata…);
 * - ask: restituisce il risultato completo, o null se è andata male (così chi chiama decide se salvarlo).
 */
export function useClaudeAdvice() {
  const [answer, setAnswer] = useState("");
  const [asking, setAsking] = useState(false);
  const [note, setNote] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  const ask = async (input: AskInput): Promise<AdviceResult | null> => {
    const controller = new AbortController();
    abortRef.current = controller;
    setAnswer("");
    setNote("");
    setAsking(true);
    // L'SDK di Anthropic si scarica solo qui, alla prima richiesta: l'avvio dell'app resta leggero.
    let ai: typeof import("@/ai/claude") | null = null;
    try {
      ai = await import("@/ai/claude");
      const result = await ai.streamAdvice({ ...input, onText: (delta) => setAnswer((a) => a + delta), signal: controller.signal });
      if (result.refused) {
        setNote("Claude non ha risposto a questa domanda: prova a riformularla.");
        return null;
      }
      if (result.truncated) setNote("La risposta è stata tagliata perché troppo lunga.");
      return result.text.trim() ? result : null;
    } catch (err) {
      setNote(ai ? ai.adviceErrorMessage(err) : "Non riesco a caricare il modulo dei consigli: controlla la connessione.");
      return null;
    } finally {
      abortRef.current = null;
      setAsking(false);
    }
  };

  const stop = () => abortRef.current?.abort();

  return { answer, asking, note, ask, stop };
}
