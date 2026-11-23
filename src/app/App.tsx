import { lazy, Suspense } from "react";
import { HashRouter, Navigate, Route, Routes } from "react-router";
import { ThemeProvider } from "./theme";
import { Toaster } from "@/components/ui/sonner";
import { Layout } from "./Layout";

// Ogni scheda è un pezzo separato del codice, caricato solo quando la apri:
// l'avvio dell'app sul telefono resta leggero anche quando le schede crescono.
const named = <K extends string>(load: () => Promise<Record<K, React.ComponentType>>, name: K) =>
  lazy(() => load().then((m) => ({ default: m[name] })));
const ImpastoPage = named(() => import("@/features/impasto/ImpastoPage"), "ImpastoPage");
const TempiPage = named(() => import("@/features/tempi/TempiPage"), "TempiPage");
const RisultatiPage = named(() => import("@/features/risultati/RisultatiPage"), "RisultatiPage");
const FarinePage = named(() => import("@/features/farine/FarinePage"), "FarinePage");
const DiarioPage = named(() => import("@/features/diario/DiarioPage"), "DiarioPage");
const TrialDetailPage = named(() => import("@/features/diario/TrialDetailPage"), "TrialDetailPage");

const page = (el: React.ReactNode) => (
  <Suspense fallback={<p className="py-10 text-center text-sm text-muted-foreground">Caricamento…</p>}>{el}</Suspense>
);

// HashRouter (indirizzi tipo .../#/tempi): funziona su GitHub Pages e in Capacitor
// senza configurare il server, perché il percorso dopo # non arriva mai al server.
// ThemeProvider gestisce chiaro/scuro/sistema mettendo la classe "dark" su <html>.
export function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <Routes>
          {/* Il reindirizzamento sta FUORI dal Layout: così all'avvio il Layout nasce già
              su /impasto e non parte una transizione da una pagina vuota. */}
          <Route index element={<Navigate to="/impasto" replace />} />
          <Route element={<Layout />}>
            <Route path="impasto" element={page(<ImpastoPage />)} />
            <Route path="tempi" element={page(<TempiPage />)} />
            <Route path="risultati" element={page(<RisultatiPage />)} />
            <Route path="farine" element={page(<FarinePage />)} />
            <Route path="diario" element={page(<DiarioPage />)} />
            <Route path="diario/:id" element={page(<TrialDetailPage />)} />
          </Route>
          <Route path="*" element={<Navigate to="/impasto" replace />} />
        </Routes>
      </HashRouter>
      <Toaster position="top-center" />
    </ThemeProvider>
  );
}
