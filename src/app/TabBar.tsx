import { NavLink } from "react-router";
import { motion } from "motion/react";
import { Archive, ChartColumn, NotebookPen, Timer, Wheat, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = { to: string; label: string; icon: LucideIcon };

const TABS: Tab[] = [
  { to: "/impasto", label: "Impasto", icon: Wheat },
  { to: "/tempi", label: "Tempi", icon: Timer },
  { to: "/risultati", label: "Risultati", icon: ChartColumn },
  { to: "/farine", label: "Farine", icon: Archive },
  { to: "/diario", label: "Diario", icon: NotebookPen },
];

// Barra a "pillola" sospesa in basso. NavLink sa se la sua rotta è attiva:
// la scheda attiva riceve lo sfondo che scorre (motion layoutId) da una scheda all'altra.
export function TabBar() {
  return (
    <nav
      aria-label="Sezioni"
      className="fixed inset-x-0 bottom-0 z-30 px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))]"
    >
      <div className="mx-auto flex max-w-md items-center gap-1 rounded-full border border-border/70 bg-card/80 p-1.5 shadow-xl shadow-black/10 backdrop-blur-xl">
        {TABS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                "relative flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-full px-1 py-2 text-[0.68rem] font-medium transition-colors",
                isActive ? "text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="tab-pill"
                    className="absolute inset-0 rounded-full bg-primary"
                    transition={{ type: "spring", stiffness: 500, damping: 38 }}
                  />
                )}
                <Icon className="relative size-5" strokeWidth={isActive ? 2.25 : 1.75} />
                <span className="relative">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
