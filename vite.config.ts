/// <reference types="vitest/config" />
import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// base "./" = percorsi relativi: la stessa build funziona su GitHub Pages
// (sotto /Alveola/) e dentro Capacitor (APK Android).
export default defineConfig({
  base: "./",
  resolve: {
    // "@/..." punta a src/: import più corti e indipendenti dalla cartella in cui sei.
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      // Mette in cache anche font e icone: l'app resta bella anche offline in laboratorio.
      // I font cirillici/vietnamiti/greci restano fuori: il browser li scarica solo se servono.
      workbox: {
        globPatterns: ["**/*.{js,css,html,woff2,png,svg}"],
        globIgnores: ["**/*-{cyrillic,cyrillic-ext,vietnamese,greek,greek-ext}-*.woff2"],
      },
      manifest: {
        name: "Alveola",
        short_name: "Alveola",
        description: "Diario di laboratorio del pizzaiolo: impasti, maturazione e prove giornaliere.",
        lang: "it",
        start_url: "./",
        scope: "./",
        display: "standalone",
        orientation: "portrait",
        background_color: "#14110E",
        theme_color: "#14110E",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png" },
          { src: "icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
  test: {
    include: ["src/**/*.test.ts"],
    passWithNoTests: true,
  },
});
