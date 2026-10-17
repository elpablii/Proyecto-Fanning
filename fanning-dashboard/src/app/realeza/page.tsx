import SalonClient, { type ArtistaSalon } from '@/components/realeza/SalonClient';
import { getRealeza, getTodos } from '@/lib/data';
import { estadisticas } from '@/lib/realeza';

export const metadata = {
  title: 'El Salón del Trono - Proyecto Fanning',
  description: 'La Realeza del Proyecto Fanning: sus reinas y reyes, en qué títulos aparecen y cuánto inglés enseñó cada uno.',
};

export default function RealezaPage() {
  const todos = getTodos();
  const artistas: ArtistaSalon[] = getRealeza().map(a => ({ ...a, stats: estadisticas(a.nombre, todos) }));
  const conRealeza = todos.filter(m => Object.keys(m.realeza ?? {}).length);
  // Fecha local del build; en el navegador se cambia por la de ese día (ver SalonClient).
  const hoy = new Date().toLocaleDateString('sv');
  return (
    <SalonClient artistas={artistas} hoy={hoy} titulosConRealeza={conRealeza.length}
      palabrasConRealeza={conRealeza.reduce((s, m) => s + m.count, 0)} />
  );
}
