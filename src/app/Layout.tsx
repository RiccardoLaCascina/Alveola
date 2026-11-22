import { useLocation, useOutlet } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { TabBar } from "./TabBar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BrandMark } from "@/components/BrandMark";
import { DoughSummary } from "./DoughSummary";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const dateFormat = new Intl.DateTimeFormat("it-IT", { weekday: "long", day: "numeric", month: "long" });

// Guscio comune: intestazione, pagina al centro (con transizione), schede in basso.
export function Layout() {
  const { pathname } = useLocation();
  // useOutlet() restituisce la pagina della rotta attiva come elemento React.
  // Rispetto a <Outlet />, l'elemento resta "congelato" dentro il div che sta uscendo:
  // così durante la dissolvenza si vede la pagina vecchia, non già quella nuova.
  const outlet = useOutlet();
  // Calcolata a ogni disegno: se l'app resta aperta oltre mezzanotte, la data si aggiorna.
  const today = dateFormat.format(new Date());

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/75 backdrop-blur-xl pt-[env(safe-area-inset-top)]">
        <div className="mx-auto flex max-w-xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <BrandMark className="size-9" />
            <div className="leading-tight">
              <h1 className="text-xl font-extrabold">Lievora</h1>
              <p className="text-xs text-muted-foreground first-letter:uppercase">{today}</p>
            </div>
          </div>
          <ThemeToggle />
        </div>
        {!["/diario", "/farine"].includes(pathname) && <DoughSummary />}
      </header>

      <main className="mx-auto max-w-xl px-4 pt-5 pb-[calc(7rem+env(safe-area-inset-bottom))]">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            <ErrorBoundary resetKey={pathname}>{outlet}</ErrorBoundary>
          </motion.div>
        </AnimatePresence>
      </main>

      <TabBar />
    </div>
  );
}
