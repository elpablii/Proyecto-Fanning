"use client";

import Link from "next/link";
import { ArrowLeft, BookOpen, Crown, ShieldAlert, Clock, Calculator, Star } from "lucide-react";

export default function RulesPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white p-8 selection:bg-purple-500/30">
      {/* Navbar/Header */}
      <header className="max-w-6xl mx-auto flex items-center justify-between mb-12">
        <div className="flex items-center gap-4">
          <Link 
            href="/"
            className="p-2 hover:bg-white/5 rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-gray-400" />
          </Link>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-purple-400" />
            Constitución y Reglas
          </h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto space-y-12">
        {/* Intro */}
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-xl">
          <p className="text-gray-300 text-lg leading-relaxed">
            Este documento centraliza el marco normativo, ético y métrico que rige el sistema de inmersión lingüística y adquisición de vocabulario en inglés (regimen B1+).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Pilares */}
          <section className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-3xl p-8 backdrop-blur-xl hover:border-purple-500/30 transition-colors">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-purple-300">
              <Crown className="w-7 h-7" />
              1. Pilares de Inmersión y Elegibilidad
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-white mb-2">Regla 1: Inmersión Total</h3>
                <p className="text-gray-400 text-sm">Todo contenido regular debe ser reproducido estrictamente en <strong>Audio Inglés + Subtítulos en Inglés</strong> (preferiblemente en formato SDH, HI o CC).</p>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">Regla 2: Cláusula Cine</h3>
                <p className="text-gray-400 text-sm">Se autoriza de forma excepcional el formato <strong>Audio Inglés + Subtítulos en Español</strong> única y exclusivamente para funciones presenciales en cines dentro de países hispanohablantes.</p>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">Regla 3: Elegibilidad de Vocabulario</h3>
                <p className="text-gray-400 text-sm">Solo los contenidos validados bajo la Regla 1 o la Regla 2 tienen la facultad de generar vocabulario oficial para el proceso de estudio.</p>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">Regla 4: Orden Canónico</h3>
                <p className="text-gray-400 text-sm">Se debe respetar rigurosamente el orden de las sagas cinematográficas o el orden cronológico de las temporadas de series, a menos que exista un conflicto directo con la <em>Prioridad de Realeza</em>.</p>
              </div>
              <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl">
                <h3 className="font-semibold text-purple-300 mb-2 flex items-center gap-2">
                  <Star className="w-4 h-4" />
                  Regla 5: Prioridad de Realeza
                </h3>
                <p className="text-gray-300 text-sm">El contenido que involucre a los miembros de la <strong>Realeza</strong> (Reyes Supremos, Reyes, Reinas y Amores Platónicos registrados) goza de preferencia absoluta sobre cualquier otra planificación o saga activa.</p>
              </div>
            </div>
          </section>

          {/* Filtros Éticos */}
          <section className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-3xl p-8 backdrop-blur-xl hover:border-red-500/30 transition-colors">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-red-400">
              <ShieldAlert className="w-7 h-7" />
              2. Filtros Éticos e Indultos Reales
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-white mb-2">Regla 6: Filtro Político-Ético</h3>
                <p className="text-gray-400 text-sm">Queda bloqueado el ingreso de cualquier contenido que promueva posturas pro-Trump, Sionismo o de personas que tengan conflictos con alguno de las reinas o reyes.</p>
              </div>
              <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
                <h3 className="font-semibold text-red-300 mb-2">Regla 7: Cláusula de Indulto Real</h3>
                <p className="text-gray-300 text-sm">El bloqueo de la Regla 6 queda sin efecto de forma inmediata si en la producción participa activamente un miembro de la Realeza, autorizando su visualización por beneficio académico directo (Para el caso Sydney Sweeney, deben haber al menos dos reinas o reyes, o un amor platónico o rey supremo).</p>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">Regla 8: Restricciones Específicas de Elenco (Veto)</h3>
                <p className="text-gray-400 text-sm mb-2">Se restringe el ingreso de contenidos protagonizados mayoritariamente por figuras bajo veto estricto (ej. Sydney Sweeney).</p>
                <p className="text-gray-500 text-sm italic">Excepciones Autorizadas: Se permite su presencia de manera exclusiva en obras corales amplias de alta relevancia para la realeza como Euphoria o apariciones contextuales específicas como Once Upon a Time in Hollywood.</p>
              </div>
            </div>
          </section>

          {/* Métricas y Sesiones */}
          <section className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-3xl p-8 backdrop-blur-xl hover:border-blue-500/30 transition-colors">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-blue-400">
              <Clock className="w-7 h-7" />
              3. Métricas, Ritmo y Sesiones
            </h2>
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold text-white mb-2">Regla 9: Ritmo y Cuotas Estacionales</h3>
                <p className="text-gray-400 text-sm mb-1">Las tandas operativas se estructuran en ciclos de <strong>14 a 17 días</strong>:</p>
                <ul className="list-disc list-inside text-sm text-gray-400 space-y-1">
                  <li><strong>Ene - Jun / Oct - Dic:</strong> Cuota base de 400 palabras.</li>
                  <li><strong>Jul - Sep:</strong> Cuota incrementada de 500 palabras.</li>
                </ul>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl">
                <h3 className="font-semibold text-blue-300 mb-2">Regla 10: Tanda de Gala (Cierre de Año)</h3>
                <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                  <li>Ejecutada estrictamente entre el <strong>25 y el 31 de diciembre</strong>.</li>
                  <li><strong>Requisito:</strong> Debe incluir obligatoriamente contenido de temática navideña.</li>
                  <li><strong>Meta Avanzada:</strong> Cuota fija de 550 palabras.</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">Regla 11: Regla de las 5 Horas</h3>
                <p className="text-gray-400 text-sm">Si la duración sumada de los contenidos programados para una tanda supera las 5 horas cronológicas, la tanda se dividirá obligatoriamente en dos sesiones consecutivas: el <strong>Día n-1</strong> (Víspera) y el <strong>Día n</strong> (Fecha original).</p>
              </div>
              <div>
                <h3 className="font-semibold text-white mb-2">Regla 12: Pausa Activa</h3>
                <p className="text-gray-400 text-sm">Para proteger la salud visual y mantener el foco cognitivo en largometrajes extensos, se aplican recesos obligatorios: Contenidos {'>'} 2 horas otorgan derecho a <strong>15 minutos</strong> de receso.</p>
              </div>
            </div>
          </section>

          {/* Métrica Matemática */}
          <section className="bg-gradient-to-b from-white/5 to-transparent border border-white/10 rounded-3xl p-8 backdrop-blur-xl hover:border-emerald-500/30 transition-colors">
            <h2 className="text-2xl font-bold mb-6 flex items-center gap-3 text-emerald-400">
              <Calculator className="w-7 h-7" />
              4. Métrica de Comprensión
            </h2>
            <div className="space-y-6">
              <p className="text-gray-300 text-sm leading-relaxed">
                El nivel de éxito técnico post-estudio se evalúa de manera estricta bajo el criterio de que <strong>una sola palabra desconocida invalida la línea de diálogo completa</strong>.
              </p>
              
              <div className="bg-black/50 border border-emerald-500/30 p-6 rounded-xl flex justify-center items-center">
                <code className="text-emerald-300 text-sm md:text-base font-mono text-center">
                  % Comprensión = <br className="md:hidden" />
                  ((Líneas Totales - Diálogos no Entendidos) <br className="md:hidden" />
                  / Líneas Totales) × 100
                </code>
              </div>

              <div>
                <h3 className="font-semibold text-emerald-300 mb-2">Regla del Redondeo Estratégico</h3>
                <p className="text-gray-400 text-sm">Si el porcentaje final de comprensión post-estudio alcanza un valor numérico <strong>≥ 99.445%</strong>, el sistema lo aproximará automáticamente al <strong>100%</strong> en los registros oficiales del informe.</p>
              </div>

              <div>
                <h3 className="font-semibold text-emerald-300 mb-2">Sistema de Bonus Especial</h3>
                <p className="text-gray-400 text-sm">La correcta asimilación y estudio de términos provenientes de <strong>inglés antiguo o moderno, francés o alemán</strong> dentro del visionado se computará como un bonus extra en la evaluación global de la tanda.</p>
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
