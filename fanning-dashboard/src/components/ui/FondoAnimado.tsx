// Fondo de cada sección: tres manchas de color que derivan muy despacio (aurora), un grano fino
// para que el degradado no se vea en franjas y una viñeta que deja el centro tranquilo.
// Solo CSS (ver .aurora en globals.css); con "reducir movimiento" queda quieto.
// Los colores son variables de Tailwind, así el modo claro también los da vuelta.
export const PALETAS = {
  inicio: ['var(--color-purple-500)', 'var(--color-pink-500)', 'var(--color-fuchsia-500)'],
  timeline: ['var(--color-blue-500)', 'var(--color-indigo-500)', 'var(--color-sky-500)'],
  reglas: ['var(--color-purple-500)', 'var(--color-violet-500)', 'var(--color-pink-500)'],
  salon: ['var(--color-amber-500)', 'var(--color-pink-500)', 'var(--color-yellow-500)'],
  constelacion: ['var(--color-indigo-500)', 'var(--color-blue-500)', 'var(--color-pink-500)'],
  // Las fichas de artista, según su grupo de la Realeza
  supremos: ['var(--color-amber-500)', 'var(--color-yellow-500)', 'var(--color-orange-500)'],
  platonicos: ['var(--color-pink-500)', 'var(--color-fuchsia-500)', 'var(--color-rose-500)'],
  reinas: ['var(--color-purple-500)', 'var(--color-pink-500)', 'var(--color-fuchsia-500)'],
  reyes: ['var(--color-sky-500)', 'var(--color-amber-500)', 'var(--color-blue-500)'],
} as const;

export type Paleta = keyof typeof PALETAS;

// Dónde nace cada mancha, hacia dónde deriva y cuánto tarda (cada una a su ritmo, para que nunca se repita igual)
const MANCHAS = [
  { top: '-30vmax', left: '-25vmax', dx: '18vmax', dy: '12vmax', duracion: 46, retraso: -8 },
  { top: '5vh', right: '-30vmax', dx: '-16vmax', dy: '18vmax', duracion: 58, retraso: -21 },
  { bottom: '-35vmax', left: '15vw', dx: '14vmax', dy: '-14vmax', duracion: 70, retraso: -37 },
];

export default function FondoAnimado({ paleta, fuerza = 16, className = 'fixed inset-0 -z-10' }: {
  paleta: Paleta;
  fuerza?: number;     // % de color en el centro de cada mancha: sutil por defecto
  className?: string;  // por defecto ocupa toda la ventana detrás del contenido
}) {
  return (
    <div aria-hidden className={`fondo-animado ${className}`}>
      {MANCHAS.map(({ dx, dy, duracion, retraso, ...lugar }, i) => (
        <span key={i} className="aurora" style={{
          ...lugar,
          ['--tono' as string]: PALETAS[paleta][i],
          ['--fuerza' as string]: `${i === 2 ? fuerza * 0.7 : fuerza}%`,
          ['--dx' as string]: dx, ['--dy' as string]: dy,
          animationDuration: `${duracion}s`, animationDelay: `${retraso}s`,
        }} />
      ))}
      <span className="grano" />
      <span className="vineta" />
    </div>
  );
}
