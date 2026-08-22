import fs from 'fs';
import path from 'path';
import DashboardClient from '@/components/DashboardClient';

export default async function Page() {
  const manifestPath = path.join(process.cwd(), 'public', 'data', 'manifest.json');
  let initialManifestData = null;

  try {
    const rawData = fs.readFileSync(manifestPath, 'utf8');
    initialManifestData = JSON.parse(rawData);
  } catch (error) {
    console.error("Error loading manifest.json on server:", error);
  }

  return <DashboardClient initialManifestData={initialManifestData} />;
}
