import { HashRouter, Navigate, Route, Routes } from "react-router";
import { Layout } from "./Layout.tsx";
import { ImpastoPage } from "../features/impasto/ImpastoPage.tsx";
import { TempiPage } from "../features/tempi/TempiPage.tsx";
import { RisultatiPage } from "../features/risultati/RisultatiPage.tsx";
import { DiarioPage } from "../features/diario/DiarioPage.tsx";

// HashRouter (indirizzi tipo .../#/tempi): funziona su GitHub Pages e in Capacitor
// senza configurare il server, perché il percorso dopo # non arriva mai al server.
export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/impasto" replace />} />
          <Route path="impasto" element={<ImpastoPage />} />
          <Route path="tempi" element={<TempiPage />} />
          <Route path="risultati" element={<RisultatiPage />} />
          <Route path="diario" element={<DiarioPage />} />
          <Route path="*" element={<Navigate to="/impasto" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
