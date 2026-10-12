// Números enteros con punto de miles: 1000 -> "1.000", 386956 -> "386.956".
export function miles(n: number | null | undefined): string {
  return Math.round(n ?? 0).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}
