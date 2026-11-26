import { Sparkles, Square } from "lucide-react";
import { toast } from "sonner";
import { Block } from "@/components/Block";
import { Button } from "@/components/ui/button";
import { buildTrialFeedbackContext } from "@/domain/consiglio";
import { canAskFeedback, withAiFeedback, type Trial } from "@/domain/prova";
import { TRIAL_QUESTION } from "@/ai/questions";
import { updateTrial, useTrials } from "@/state/trials";
import { ClaudeAnswer, ClaudeKeySetup, ClaudeNote, ClaudePrivacy } from "@/features/ai/ClaudeParts";
import { useClaudeAdvice, useClaudeKey } from "@/features/ai/useClaude";

/**
 * "Cosa cambio la prossima volta?": Claude legge la prova completa (ricetta, temperature misurate,
 * note, voti, commento) e la confronta con le prove precedenti. Il consiglio resta salvato nella prova.
 * `dirty`: il modulo della prova ha modifiche non salvate (prima si salva, poi si chiede).
 */
export function TrialFeedback({ trial, dirty }: { trial: Trial; dirty: boolean }) {
  const { apiKey, setApiKey, forget } = useClaudeKey();
  const { trials } = useTrials();
  const { answer, asking, note, ask, stop } = useClaudeAdvice();
  const ready = canAskFeedback(trial);
  const saved = trial.aiFeedback;

  const onAsk = async () => {
    const result = await ask({ kind: "trial", apiKey, context: buildTrialFeedbackContext(trial, trials), question: TRIAL_QUESTION });
    if (!result) return;
    try {
      await updateTrial(trial.id, (t) => withAiFeedback(t, result.text, result.model));
      toast.success("Consiglio salvato nella prova.");
    } catch {
      toast.error("Consiglio ricevuto, ma non sono riuscito a salvarlo nella prova.");
    }
  };

  // mentre arriva (o appena arrivata) mostriamo la risposta nuova; altrimenti quella salvata
  const showingNew = asking || answer !== "";
  const savedFooter = saved ? `Consiglio del ${new Date(saved.createdAt).toLocaleDateString("it-IT")}` : undefined;

  return (
    <Block icon={Sparkles} title="Cosa cambio la prossima volta?" hint="Claude legge questa prova e la confronta con le tue prove precedenti.">
      {!apiKey ? (
        <ClaudeKeySetup onSaved={setApiKey} />
      ) : (
        <div className="flex flex-col gap-3">
          {showingNew ? <ClaudeAnswer text={answer} asking={asking} /> : saved && <ClaudeAnswer text={saved.text} asking={false} footer={savedFooter} />}
          <ClaudeNote>{note}</ClaudeNote>

          {!ready ? (
            <p className="text-sm text-muted-foreground">Metti almeno un voto o un commento e salva la prova: poi Claude ti dice cosa cambiare.</p>
          ) : asking ? (
            <Button type="button" variant="outline" className="h-12 rounded-xl" onClick={stop}>
              <Square /> Ferma
            </Button>
          ) : (
            <>
              <Button type="button" className="h-12 rounded-xl text-base" onClick={onAsk} disabled={dirty}>
                <Sparkles /> {saved ? "Chiedi un nuovo consiglio" : "Chiedi a Claude"}
              </Button>
              {dirty && <p className="text-sm text-muted-foreground">Prima salva la prova, così Claude legge i voti aggiornati.</p>}
            </>
          )}
          <ClaudePrivacy what="i dati di questa prova e delle prove precedenti" onForgetKey={forget} />
        </div>
      )}
    </Block>
  );
}
