import { useState, type ReactNode } from "react";
import { KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { looksLikeApiKey, saveApiKey } from "@/ai/apiKey";

const CONSOLE_KEYS_URL = "https://console.anthropic.com/settings/keys";

/** Come ottenere la chiave e dove incollarla. Chiama onSaved quando la chiave è salvata sul telefono. */
export function ClaudeKeySetup({ onSaved }: { onSaved: (key: string) => void }) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  const save = () => {
    const key = draft.trim();
    if (!looksLikeApiKey(key)) return setError("Non sembra una chiave di Anthropic: deve iniziare con “sk-ant-”.");
    if (!saveApiKey(key)) return setError("Non riesco a salvarla su questo dispositivo (navigazione privata?).");
    onSaved(key);
  };

  return (
    <div className="flex flex-col gap-3 text-sm">
      <ol className="list-decimal space-y-1.5 pl-5 text-muted-foreground">
        <li>
          Crea un account su{" "}
          <a href={CONSOLE_KEYS_URL} target="_blank" rel="noreferrer" className="font-medium text-primary underline underline-offset-2">
            console.anthropic.com
          </a>{" "}
          e aggiungi un po’ di credito (paghi a consumo: pochi centesimi a consiglio).
        </li>
        <li>Crea una chiave API (“Create Key”) e copiala.</li>
        <li>Incollala qui sotto: resta solo su questo telefono.</li>
      </ol>
      <div className="flex gap-2">
        <Input
          type="password"
          autoComplete="off"
          spellCheck={false}
          placeholder="sk-ant-…"
          aria-label="Chiave API di Anthropic"
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setError("");
          }}
          className="h-11"
        />
        <Button type="button" className="h-11" onClick={save} disabled={!draft.trim()}>
          <KeyRound /> Salva
        </Button>
      </div>
      {error && <p className="rounded-lg bg-warm/15 px-3 py-2">{error}</p>}
    </div>
  );
}

/** Riquadro della risposta: "sta pensando…" finché non arriva il primo testo. */
export function ClaudeAnswer({ text, asking, footer }: { text: string; asking: boolean; footer?: ReactNode }) {
  if (!text && !asking) return null;
  return (
    <div aria-live="polite" className="rounded-xl bg-muted/50 px-3 py-3 text-sm leading-relaxed">
      <div className="whitespace-pre-wrap">{text || <span className="text-muted-foreground">Claude sta pensando…</span>}</div>
      {footer && <p className="mt-2 text-xs text-muted-foreground">{footer}</p>}
    </div>
  );
}

/** Avviso sotto la risposta (errori, risposta tagliata…). */
export function ClaudeNote({ children }: { children: ReactNode }) {
  if (!children) return null;
  return <p className="rounded-lg bg-warm/15 px-3 py-2 text-sm">{children}</p>;
}

/** Riga finale: cosa viene inviato, chi paga, e come togliere la chiave. */
export function ClaudePrivacy({ what, onForgetKey }: { what: string; onForgetKey: () => void }) {
  return (
    <p className="text-xs text-muted-foreground">
      Invia ad Anthropic {what}. Il costo va sul tuo account Anthropic.{" "}
      <button type="button" className="underline underline-offset-2" onClick={onForgetKey}>
        Togli la chiave
      </button>
    </p>
  );
}
