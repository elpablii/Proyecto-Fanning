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

// Duración en minutos: 97 -> "1 h 37 min", 45 -> "45 min", 600 -> "10 h". null -> "—".
export function duracion(minutos: number | null | undefined): string {
  if (!minutos) return '—';
  const h = Math.floor(minutos / 60);
  const m = Math.round(minutos % 60);
  if (!h) return `${m} min`;
  return m ? `${miles(h)} h ${m} min` : `${miles(h)} h`;
}

// Momento de un subtítulo, en segundos desde el comienzo: 1738 -> "28:58"; 7045 -> "1:57:25".
export function minuto(segundo: number): string {
  const h = Math.floor(segundo / 3600);
  const m = Math.floor((segundo % 3600) / 60);
  const s = segundo % 60;
  const mm = h ? String(m).padStart(2, '0') : String(m);
  return `${h ? `${h}:` : ''}${mm}:${String(s).padStart(2, '0')}`;
}
