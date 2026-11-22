import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type BlockProps = {
  title: string;
  hint?: string;
  icon?: LucideIcon;
  children?: ReactNode;
};

// Riquadro con icona, titolo e suggerimento, usato da tutte le schede.
// È un componente "di presentazione": riceve dati (props) e li disegna, senza logica.
export function Block({ title, hint, icon: Icon, children }: BlockProps) {
  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex items-start gap-3">
          {Icon && (
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-accent text-accent-foreground">
              <Icon className="size-[1.1rem]" />
            </span>
          )}
          <div className="space-y-1">
            <CardTitle className="font-heading text-lg">{title}</CardTitle>
            {hint && <CardDescription>{hint}</CardDescription>}
          </div>
        </div>
      </CardHeader>
      {children && <CardContent>{children}</CardContent>}
    </Card>
  );
}
