import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Transiciones entre páginas: los pósters y las fotos de la Realeza vuelan de una página a otra
    // (ver src/lib/transiciones.ts).
    viewTransition: true,
  },
};

export default nextConfig;
