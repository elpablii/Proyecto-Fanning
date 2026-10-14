import TimelineClient from '@/components/TimelineClient';
import { getLineaDeTiempo } from '@/lib/data';

export const metadata = {
  title: 'Línea de Tiempo - Proyecto Fanning',
  description: 'Historial de tandas de vocabulario procesadas en el proyecto.',
};

export default function TimelinePage() {
  const { ciclos, tandas } = getLineaDeTiempo();
  // Fecha del build: las tandas posteriores se muestran como "Programada".
  const hoy = new Date().toISOString().slice(0, 10);
  return <TimelineClient ciclos={ciclos} tandas={tandas} hoy={hoy} />;
}
