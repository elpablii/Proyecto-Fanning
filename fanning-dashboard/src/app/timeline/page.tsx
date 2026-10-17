import TimelineClient, { type RealezaPorTitulo } from '@/components/TimelineClient';
import { getLineaDeTiempo, getRealezaDeTitulo, getTodos } from '@/lib/data';

export const metadata = {
  title: 'Línea de Tiempo - Proyecto Fanning',
  description: 'Historial de tandas de vocabulario procesadas en el proyecto.',
};

export default function TimelinePage() {
  const { ciclos, tandas } = getLineaDeTiempo();
  // Fecha del build: las tandas posteriores se muestran como "Programada".
  const hoy = new Date().toISOString().slice(0, 10);
  // Quién de la Realeza está en cada título ("movie:Barbie"), para marcar las Tandas Reales.
  const realeza: RealezaPorTitulo = {};
  for (const m of getTodos()) {
    const miembros = getRealezaDeTitulo(m).map(({ nombre, foto, tipo, rango }) => ({ nombre, foto, tipo, rango }));
    if (miembros.length) realeza[`${m.type ?? 'movie'}:${m.title}`] = miembros;
  }
  return <TimelineClient ciclos={ciclos} tandas={tandas} hoy={hoy} realeza={realeza} />;
}
