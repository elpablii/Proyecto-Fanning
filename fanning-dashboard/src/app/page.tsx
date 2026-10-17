import { Suspense } from 'react';
import DashboardClient, { DashboardVista, type ArtistasPorNombre } from '@/components/DashboardClient';
import { agruparTandas, getLineaDeTiempo, getPortada, getRealeza, getTodos } from '@/lib/data';
import { estadisticas } from '@/lib/realeza';
import type { CandidatoDelDia } from '@/components/realeza/ReinaDelDia';
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
  // Para las insignias de la Realeza en los pósters: solo el nombre, la foto y el rango.
  const artistas: ArtistasPorNombre = Object.fromEntries(
    getRealeza().map(({ nombre, foto, tipo, rango }) => [nombre, { nombre, foto, tipo, rango }]));
  // Para la Reina o Rey del día: cada miembro con sus cifras y hasta 5 pósters (se elige en el navegador).
  const todos = getTodos();
  const delDia: CandidatoDelDia[] = getRealeza().map(a => {
    const { titulos, palabras } = estadisticas(a.nombre, todos);
    return {
      ...a, titulos: titulos.length, palabras,
      posters: titulos.filter(t => t.posterUrl).slice(0, 5).map(({ title, posterUrl }) => ({ title, posterUrl })),
    };
  });
  const hoy = new Date().toLocaleDateString('sv');
  // La portada lee el año elegido de la URL (?year=2025). Mientras eso carga en el navegador,
  // se muestra (y se genera en el build) la vista con el histórico completo.
  return (
    <Suspense fallback={<DashboardVista portada={portada} tandas={tandas} artistas={artistas} delDia={delDia} hoy={hoy} selectedYear="all" />}>
      <DashboardClient portada={portada} tandas={tandas} artistas={artistas} delDia={delDia} hoy={hoy} />
    </Suspense>
  );
}
