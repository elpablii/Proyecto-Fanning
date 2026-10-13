import { Suspense } from 'react';
import DashboardClient, { DashboardVista } from '@/components/DashboardClient';
import { getManifest } from '@/lib/data';

export default function Page() {
  const manifest = getManifest() ?? {};
  // La portada lee el año elegido de la URL (?year=2025). Mientras eso carga en el navegador,
  // se muestra (y se genera en el build) la vista con el histórico completo.
  return (
    <Suspense fallback={<DashboardVista manifestData={manifest} selectedYear="all" />}>
      <DashboardClient manifestData={manifest} />
    </Suspense>
  );
}
