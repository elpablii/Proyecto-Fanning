import { ViewTransition } from 'react';

// La animación al entrar a cada sección. Va en los template.tsx: Next los vuelve a montar en cada
// navegación, así la página que se va hace su salida y la que llega su entrada (ver globals.css).
// Lo que cambia dentro de una misma página (el año, un filtro) no anima nada: update="none".
// Los enlaces de "Volver" pasan transitionTypes={['atras']} y la animación va hacia el otro lado.
// Los pósters y las fotos con nombre (lib/transiciones.ts) siguen volando por su cuenta.
export default function TransicionPagina({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition
      enter={{ atras: 'pagina-vuelve', default: 'pagina-entra' }}
      exit={{ atras: 'pagina-se-va-atras', default: 'pagina-se-va' }}
      update="none"
      default="none">
      {children}
    </ViewTransition>
  );
}
