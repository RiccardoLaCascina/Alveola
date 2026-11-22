import { HashRouter, Navigate, Route, Routes } from "react-router";
import { ThemeProvider } from "./theme";
import { Toaster } from "@/components/ui/sonner";
import { Layout } from "./Layout";
import { ImpastoPage } from "@/features/impasto/ImpastoPage";
import { TempiPage } from "@/features/tempi/TempiPage";
import { RisultatiPage } from "@/features/risultati/RisultatiPage";
import { DiarioPage } from "@/features/diario/DiarioPage";

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
            <Route path="impasto" element={<ImpastoPage />} />
            <Route path="tempi" element={<TempiPage />} />
            <Route path="risultati" element={<RisultatiPage />} />
            <Route path="diario" element={<DiarioPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/impasto" replace />} />
        </Routes>
      </HashRouter>
      <Toaster position="top-center" />
    </ThemeProvider>
  );
}
