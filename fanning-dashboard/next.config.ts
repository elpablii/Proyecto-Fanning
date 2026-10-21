import type { NextConfig } from "next";

// Las transiciones entre páginas (los pósters y las fotos de la Realeza vuelan de una página a otra,
// ver src/lib/transiciones.ts) ya no necesitan configuración: desde Next 16.4 vienen activadas.
const nextConfig: NextConfig = {
  // La página de cada palabra (/diccionario/[slug]) se genera cuando alguien la abre, no en el build:
  // el servidor necesita tener a mano los datos que lee (ver src/lib/data.ts).
  outputFileTracingIncludes: {
    '/diccionario/\\[slug\\]': [
      './data/diccionario.json', './data/diccionario_frases.json', './data/manifest.json', './data/realeza.json',
    ],
  },
};

export default nextConfig;
