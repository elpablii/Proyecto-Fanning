// % de comprensión = (líneas de diálogo − palabras no entendidas) / líneas de diálogo × 100.
// Devuelve null si no hay líneas de diálogo. Desde 99,445 % se redondea a 100 %
// (para que no se muestre "99,45 %" cuando prácticamente se entendió todo).
export function comprension(dialogos: number | null | undefined, palabras: number | null | undefined): number | null {
  if (!dialogos || dialogos <= 0) return null;
  const pct = ((dialogos - (palabras ?? 0)) / dialogos) * 100;
  return pct >= 99.445 ? 100 : Math.max(0, pct);
}
