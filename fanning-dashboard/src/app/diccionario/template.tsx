import TransicionPagina from '@/components/ui/TransicionPagina';

// Se vuelve a montar en cada navegación: la animación de entrada y salida (ver TransicionPagina).
export default function Template({ children }: { children: React.ReactNode }) {
  return <TransicionPagina>{children}</TransicionPagina>;
}
