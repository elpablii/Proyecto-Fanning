import ConstelacionClient from '@/components/realeza/ConstelacionClient';
import { getRealeza, getTodos } from '@/lib/data';
import { acomodar, hilos } from '@/lib/constelacion';
import { estadisticas } from '@/lib/realeza';

export const metadata = {
  title: 'La Constelación Real - Proyecto Fanning',
  description: 'Cómo se conectan las reinas y los reyes del Proyecto Fanning a través de los títulos que comparten.',
};

export default function ConstelacionPage() {
  const todos = getTodos();
  const artistas = getRealeza()
    .map(({ nombre, foto, tipo, rango }) => {
      const s = estadisticas(nombre, todos);
      return { nombre, foto, tipo, rango, titulos: s.titulos.length, palabras: s.palabras };
    })
    .filter(a => a.titulos > 0);
  const enlaces = hilos(todos, new Set(artistas.map(a => a.nombre)));
  return <ConstelacionClient estrellas={acomodar(artistas, enlaces)} hilos={enlaces} />;
}
