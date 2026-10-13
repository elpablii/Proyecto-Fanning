import React from 'react';
import { X } from 'lucide-react';

// Imagen a pantalla completa. Se cierra con un clic fuera de la imagen o con la X.
export default function ImageLightbox({ src, onClose }: { src: string | null; onClose: () => void }) {
  if (!src) return null;
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 cursor-zoom-out" onClick={onClose}>
      <button
        onClick={onClose}
        className="absolute top-6 right-6 text-white/60 hover:text-white p-2 transition-colors bg-white/10 hover:bg-white/20 rounded-full"
        aria-label="Cerrar"
      >
        <X size={24} />
      </button>
      <img
        src={src}
        alt=""
        className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl cursor-default"
        onClick={e => e.stopPropagation()}
      />
    </div>
  );
}
