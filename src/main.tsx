import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/app/App";
import "@/styles/global.css";
import { migrateFromOldName } from "@/data/db";

// Se l'app era installata col vecchio nome (Alveola), sposta l'archivio farine nel nuovo database.
void migrateFromOldName();

const root = document.getElementById("root");
if (!root) throw new Error("Elemento #root non trovato in index.html");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
