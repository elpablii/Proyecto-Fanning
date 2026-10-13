// Números enteros con punto de miles: 1000 -> "1.000", 386956 -> "386.956".
export function miles(n: number | null | undefined): string {
  return Math.round(n ?? 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

// Porcentaje con coma decimal: 93.6512 -> "93,65%". null -> "N/A".
export function porcentaje(n: number | null | undefined, decimales = 2): string {
  if (n === null || n === undefined || Number.isNaN(n)) return 'N/A';
  const [entero, fraccion] = n.toFixed(decimales).split('.');
  return `${miles(Number(entero))}${fraccion ? ',' + fraccion : ''}%`;
}
