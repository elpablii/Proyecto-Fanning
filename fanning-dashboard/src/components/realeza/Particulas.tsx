// Fondo del Salón del Trono: destellos dorados que suben (los Reyes) y pétalos rosas que caen
// (las Reinas). Posiciones fijas, no al azar, para que el build y el navegador coincidan.
// Solo CSS (ver .chispa y .petalo en globals.css); con "reducir movimiento" no se muestran.
const CHISPAS = Array.from({ length: 22 }, (_, i) => ({
  izquierda: (i * 47 + 13) % 100,
  tamano: 3 + (i % 4),
  duracion: 9 + (i % 6) * 2.2,
  retraso: -((i * 1.7) % 14),
}));

const PETALOS = Array.from({ length: 16 }, (_, i) => ({
  izquierda: (i * 61 + 29) % 100,
  tamano: 9 + (i % 4) * 3,
  duracion: 13 + (i % 5) * 3,
  retraso: -((i * 2.3) % 18),
  deriva: (i % 2 ? 1 : -1) * (30 + (i % 3) * 25),
}));

export default function Particulas() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      {CHISPAS.map((c, i) => (
        <span key={`c${i}`} className="chispa" style={{
          left: `${c.izquierda}%`, width: c.tamano, height: c.tamano,
          animationDuration: `${c.duracion}s`, animationDelay: `${c.retraso}s`,
        }} />
      ))}
      {PETALOS.map((p, i) => (
        <span key={`p${i}`} className="petalo" style={{
          left: `${p.izquierda}%`, width: p.tamano, height: p.tamano * 0.8,
          animationDuration: `${p.duracion}s`, animationDelay: `${p.retraso}s`,
          ['--deriva' as string]: `${p.deriva}px`,
        }} />
      ))}
    </div>
  );
}
