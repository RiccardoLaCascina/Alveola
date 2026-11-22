import { Outlet } from "react-router";
import { TabBar } from "./TabBar.tsx";

// Guscio comune a tutte le schede: intestazione in alto, pagina al centro, schede in basso.
// <Outlet /> è il punto in cui React Router inserisce la pagina della rotta attiva.
export function Layout() {
  return (
    <>
      <header className="top">
        <div className="top-row">
          <h1>Alveola</h1>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <TabBar />
    </>
  );
}
