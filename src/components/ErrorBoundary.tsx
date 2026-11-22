import { Component, type ErrorInfo, type ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

type State = { error: Error | null };

/**
 * Rete di sicurezza: se una scheda va in errore, al posto della pagina bianca
 * mostriamo un messaggio e un pulsante per ricaricare. Le altre schede restano usabili.
 * (Gli error boundary di React esistono solo come componenti a classe.)
 */
export class ErrorBoundary extends Component<{ children: ReactNode; resetKey?: string }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Errore in una scheda di Lievora", error, info.componentStack);
  }

  componentDidUpdate(prev: { resetKey?: string }) {
    // cambiando scheda si riprova
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed p-8 text-center">
        <TriangleAlert className="size-8 text-warm" />
        <p className="font-heading text-lg font-bold">Qualcosa non ha funzionato</p>
        <p className="max-w-xs text-sm text-muted-foreground">I tuoi dati sono al sicuro. Prova a ricaricare l’app.</p>
        <Button onClick={() => location.reload()}>Ricarica</Button>
      </div>
    );
  }
}
