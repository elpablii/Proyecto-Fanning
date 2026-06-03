"use client";

import React, { useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line
} from 'recharts';
import { Film, BookOpen, Crown, TrendingUp, Search, PlayCircle } from 'lucide-react';

// Hardcoded mock data based on our actual extraction
const topWordsGlobal = [
  { word: "creep", count: 13, year: "2023-2025" },
  { word: "creepy", count: 12, year: "2023-2025" },
  { word: "scratch", count: 12, year: "2023-2025" },
  { word: "spare", count: 12, year: "2023-2025" },
  { word: "swell", count: 11, year: "2023-2025" },
  { word: "stand", count: 11, year: "2023-2025" },
  { word: "stall", count: 10, year: "2023-2025" },
  { word: "bargain", count: 10, year: "2023-2025" },
  { word: "make out", count: 10, year: "2023-2025" },
  { word: "rely", count: 10, year: "2023-2025" },
];

const yearlyData = [
  { year: "2023", words: 450, movies: 30 },
  { year: "2024", words: 1200, movies: 55 },
  { year: "2025", words: 2429, movies: 36 },
];

const genreData = [
  { name: 'Drama/Suspense', value: 45 },
  { name: 'Animation', value: 30 },
  { name: 'Sci-Fi/Action', value: 25 },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans p-8">
      {/* Header */}
      <header className="mb-10 flex justify-between items-end border-b border-gray-800 pb-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
            Fanning Analytics
          </h1>
          <p className="text-gray-400 mt-2 text-lg">Métricas de inmersión y adquisición de vocabulario</p>
        </div>
        <div className="flex gap-4">
          <button className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg transition flex items-center gap-2">
            <Search size={18} /> Buscar Palabra
          </button>
          <button className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg transition font-medium shadow-lg shadow-purple-900/20">
            Sincronizar Datos
          </button>
        </div>
      </header>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-gray-400 font-medium">Total Vocabulario</h3>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg"><BookOpen size={20} /></div>
          </div>
          <p className="text-3xl font-bold">4,079</p>
          <p className="text-sm text-green-400 mt-2 flex items-center gap-1"><TrendingUp size={14} /> +15% este año</p>
        </div>
        
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-gray-400 font-medium">Diálogos Analizados</h3>
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg"><Film size={20} /></div>
          </div>
          <p className="text-3xl font-bold">121</p>
          <p className="text-sm text-gray-500 mt-2">176 vocabularios mapeados</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-gray-400 font-medium">Palabra más Frecuente</h3>
            <div className="p-2 bg-pink-500/10 text-pink-400 rounded-lg"><TrendingUp size={20} /></div>
          </div>
          <p className="text-3xl font-bold">Creep</p>
          <p className="text-sm text-gray-500 mt-2">13 apariciones comprobadas</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-gray-400 font-medium">Reina Dominante</h3>
            <div className="p-2 bg-yellow-500/10 text-yellow-400 rounded-lg"><Crown size={20} /></div>
          </div>
          <p className="text-3xl font-bold">Dakota F.</p>
          <p className="text-sm text-gray-500 mt-2">Mayor densidad léxica</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Chart Section */}
        <div className="col-span-2 bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <TrendingUp className="text-purple-500" /> Crecimiento de Vocabulario por Año
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yearlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
                <XAxis dataKey="year" stroke="#9CA3AF" axisLine={false} tickLine={false} />
                <YAxis stroke="#9CA3AF" axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Bar dataKey="words" fill="url(#colorWords)" radius={[6, 6, 0, 0]} />
                <defs>
                  <linearGradient id="colorWords" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#9333EA" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#EC4899" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Words Table */}
        <div className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
          <h3 className="text-xl font-bold mb-6">🏆 Top 10 Global</h3>
          <div className="overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="text-gray-400 border-b border-gray-800">
                  <th className="pb-3 font-medium">Palabra / Frase</th>
                  <th className="pb-3 font-medium text-right">Repeticiones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {topWordsGlobal.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-800/50 transition">
                    <td className="py-3 font-medium flex items-center gap-3">
                      <span className="text-gray-500 text-sm w-4">{index + 1}.</span>
                      {item.word}
                    </td>
                    <td className="py-3 text-right text-purple-400 font-bold">{item.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button className="w-full mt-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm text-gray-300 transition">
            Ver todas las palabras
          </button>
        </div>

      </div>
    </div>
  );
}
