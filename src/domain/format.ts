/** Numero in formato italiano (virgola decimale, punto delle migliaia). */
export function fmt(n: number, decimals = 0): string {
  return n.toLocaleString("it-IT", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/** Grammi: un decimale sotto i 10 g (lievito, sale piccolo), interi sopra. */
export function fmtGrams(n: number): string {
  return fmt(n, n > 0 && n < 10 ? 1 : 0);
}

/** Percentuale di `part` su `whole`; 0 se `whole` non è positivo. */
export function percent(part: number, whole: number): number {
  return whole > 0 ? (part / whole) * 100 : 0;
}
