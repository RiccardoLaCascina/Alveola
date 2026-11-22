import type { ReactNode } from "react";
import { NavLink } from "react-router";

type Tab = { to: string; label: string; icon: ReactNode };

const TABS: Tab[] = [
  {
    to: "/impasto",
    label: "Impasto",
    icon: (
      <>
        <ellipse cx="12" cy="13" rx="9" ry="6" />
        <path d="M9 10l1.5 6M13 10l1.5 6" />
      </>
    ),
  },
  {
    to: "/tempi",
    label: "Tempi",
    icon: (
      <>
        <circle cx="12" cy="13" r="8" />
        <path d="M12 9v4l3 2M10 3h4" />
      </>
    ),
  },
  {
    to: "/risultati",
    label: "Risultati",
    icon: <path d="M5 20V10M12 20V4M19 20v-7" />,
  },
  {
    to: "/diario",
    label: "Diario",
    icon: (
      <>
        <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z" />
        <path d="M5 17a3 3 0 0 1 3-3h11M9 8h6" />
      </>
    ),
  },
];

// NavLink sa se la sua rotta è attiva: in quel caso aggiunge aria-current="page",
// che il CSS usa per evidenziare la scheda.
export function TabBar() {
  return (
    <nav className="tabs" aria-label="Sezioni">
      {TABS.map((tab) => (
        <NavLink key={tab.to} to={tab.to}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            {tab.icon}
          </svg>
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
