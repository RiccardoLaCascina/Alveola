import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/app/App";
import "@/styles/global.css";

const root = document.getElementById("root");
if (!root) throw new Error("Elemento #root non trovato in index.html");

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
