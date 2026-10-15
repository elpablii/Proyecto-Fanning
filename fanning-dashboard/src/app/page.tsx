import { Suspense } from 'react';
import DashboardClient, { DashboardVista } from '@/components/DashboardClient';
import { agruparTandas, getLineaDeTiempo, getPortada } from '@/lib/data';
import type { TandaResumen } from '@/components/charts/EvolucionComprension';

export default function Page() {
  // Solo lo que muestra la portada: el manifest completo (con los episodios) no viaja al navegador.
  const portada = getPortada();
  // Solo lo que usa el gráfico de comprensión, para no mandar la línea de tiempo entera al navegador.
  // Las partes de una tanda (14a°, 14b°) van juntas: son una sola tanda.
  const tandas: TandaResumen[] = agruparTandas(getLineaDeTiempo().tandas).map(t => ({
    numero: t.numero, title: t.title, date: t.date, anio: t.anio, palabras: t.palabras, lineas: t.lineas,
    ingles: t.ingles, titulos: t.partes.flatMap(p => p.items.map(i => i.texto)),
  }));
  // La portada lee el año elegido de la URL (?year=2025). Mientras eso carga en el navegador,
  // se muestra (y se genera en el build) la vista con el histórico completo.
  return (
    <Suspense fallback={<DashboardVista portada={portada} tandas={tandas} selectedYear="all" />}>
      <DashboardClient portada={portada} tandas={tandas} />
    </Suspense>
  );
}
