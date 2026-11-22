import type { ReactNode } from "react";

export function EmptyHint({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed px-4 py-4 text-center text-sm text-muted-foreground">{children}</p>;
}
