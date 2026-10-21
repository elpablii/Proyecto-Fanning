import type { Metadata } from "next";
import { Outfit, Geist_Mono, Quattrocento_Sans } from "next/font/google";
import "./globals.css";
import TemaSelector from "@/components/ui/TemaSelector";
import { SCRIPT_TEMA } from "@/lib/tema";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

// Letra de la Realeza (nombres y títulos del Salón): sin remates, de proporciones clásicas
// (inspirada en las letras del Renacimiento italiano).
const quattrocento = Quattrocento_Sans({
  variable: "--font-quattrocento",
  subsets: ["latin"],
  weight: ["400", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Proyecto Fanning",
  description: "El Proyecto Fanning aprende inglés con películas y series: aquí se ve el vocabulario, la comprensión y el nivel MCER de cada título.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // data-tema lo pone el script antes de pintar (ver TemaSelector), por eso no coincide con el build.
    <html
      lang="es"
      className={`${outfit.variable} ${geistMono.variable} ${quattrocento.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA }} />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <TemaSelector />
      </body>
    </html>
  );
}
