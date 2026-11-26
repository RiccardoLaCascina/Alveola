import { useState } from "react";
import { Sparkles, Square } from "lucide-react";
import { Block } from "@/components/Block";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { buildAdviceContext } from "@/domain/consiglio";
import { useDoughAnalysis, useDoughStore } from "@/state/doughStore";
import { useTrials } from "@/state/trials";
import { DEFAULT_QUESTION } from "@/ai/questions";
import { ClaudeAnswer, ClaudeKeySetup, ClaudeNote, ClaudePrivacy } from "@/features/ai/ClaudeParts";
import { useClaudeAdvice, useClaudeKey } from "@/features/ai/useClaude";

/**
 * "Chiedi a Claude": consiglio sull'impasto di oggi, con la chiave del pizzaiolo.
 * Senza chiave mostra come ottenerla; con la chiave, una domanda facoltativa e la risposta che arriva mentre viene scritta.
 */
export function AdviceCard() {
  const { apiKey, setApiKey, forget } = useClaudeKey();

  return (
    <Block icon={Sparkles} title="Chiedi a Claude" hint="Un consiglio sull’impasto di oggi, dalle farine alle tue ultime prove.">
      {apiKey ? <AskClaude apiKey={apiKey} onForgetKey={forget} /> : <ClaudeKeySetup onSaved={setApiKey} />}
    </Block>
  );
}

function AskClaude({ apiKey, onForgetKey }: { apiKey: string; onForgetKey: () => void }) {
  const dough = useDoughStore((s) => s.dough);
  const analysis = useDoughAnalysis();
  const { trials } = useTrials();
  const [question, setQuestion] = useState("");
  const { answer, asking, note, ask, stop } = useClaudeAdvice();

  const onAsk = () =>
    ask({ kind: "dough", apiKey, context: buildAdviceContext(dough, analysis, trials), question: question.trim() || DEFAULT_QUESTION });

  return (
    <div className="flex flex-col gap-3">
      <Textarea
        aria-label="Domanda per Claude"
        placeholder="Facoltativo. Es.: ieri la pizza si strappava stendendola, cosa cambio?"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        disabled={asking}
        className="min-h-20"
      />
      {asking ? (
        <Button type="button" variant="outline" className="h-12 rounded-xl" onClick={stop}>
          <Square /> Ferma
        </Button>
      ) : (
        <Button type="button" className="h-12 rounded-xl text-base" onClick={onAsk}>
          <Sparkles /> {question.trim() ? "Chiedi" : "Controlla il mio impasto"}
        </Button>
      )}
      <ClaudeAnswer text={answer} asking={asking} />
      <ClaudeNote>{note}</ClaudeNote>
      <ClaudePrivacy what="i dati di impasto, farine e ultime prove del diario" onForgetKey={onForgetKey} />
    </div>
  );
}
