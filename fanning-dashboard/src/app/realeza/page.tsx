import SalonClient, { type ArtistaSalon } from '@/components/realeza/SalonClient';
import type { FilaPodio } from '@/components/realeza/PodioReal';
import { getProximamente, getRealeza, getTitulo, getTodos } from '@/lib/data';
import { estadisticas } from '@/lib/realeza';

export const metadata = {
  title: 'El Salón del Trono - Proyecto Fanning',
  description: 'La Realeza del Proyecto Fanning: sus reinas y reyes, en qué títulos aparecen y cuánto inglés enseñó cada uno.',
};

export default function RealezaPage() {
  const todos = getTodos();
  const proximamente = getProximamente();
  // A quien aún no tiene títulos, la carta le cuenta con qué llega.
  const artistas: ArtistaSalon[] = getRealeza().map(a => ({
    ...a, stats: estadisticas(a.nombre, todos), proximo: proximamente[a.nombre]?.[0] ?? null,
  }));
  const conRealeza = todos.filter(m => Object.keys(m.realeza ?? {}).length);

  // Palabras por minuto de cada título (nivel MCER, señal de diálogos), para el ritmo del podio.
  const ppm = new Map(conRealeza.map(m => [m.title, getTitulo(m.title, m.type ?? 'movie')?.extraData?.levelDetail?.dialogos?.ppm ?? null]));
  const podio: FilaPodio[] = artistas.filter(a => a.stats.titulos.length).map(({ nombre, foto, tipo, rango, stats }) => {
    let peso = 0, suma = 0;
    for (const t of stats.titulos) {
      const v = ppm.get(t.title);
      if (v == null || !t.duration) continue;
      peso += t.duration;
      suma += v * t.duration;
    }
    return {
      nombre, foto, tipo, rango, titulos: stats.titulos.length, palabras: stats.palabras, lineas: stats.lineas,
      minutos: stats.minutos, comprension: stats.comprension, ritmo: peso ? suma / peso : null,
    };
  });
  // Fecha local del build; en el navegador se cambia por la de ese día (ver SalonClient).
  const hoy = new Date().toLocaleDateString('sv');
  return (
    <SalonClient artistas={artistas} podio={podio} hoy={hoy} titulosConRealeza={conRealeza.length}
      palabrasConRealeza={conRealeza.reduce((s, m) => s + m.count, 0)} />
  );
}
