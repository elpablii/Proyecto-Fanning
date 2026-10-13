import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Las imágenes vienen de TMDB ya en el tamaño justo (w92, w500, w780) y son más de 1.000.
      // next/image las pasaría por la optimización de imágenes de Vercel, que en el plan gratuito
      // tiene un límite mensual. Por eso se usa <img> (con loading="lazy" donde conviene).
      "@next/next/no-img-element": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
