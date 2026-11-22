import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/app/theme";
import { Button } from "@/components/ui/button";

// Passa da chiaro a scuro. La scelta resta salvata in localStorage (vedi app/theme.tsx).
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <Button
      variant="ghost"
      size="icon"
      className="rounded-full"
      aria-label={isDark ? "Passa al tema chiaro" : "Passa al tema scuro"}
      onClick={() => setTheme(isDark ? "light" : "dark")}
    >
      {isDark ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </Button>
  );
}
