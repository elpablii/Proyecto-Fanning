"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ArrowLeft, Calendar, Loader2, Image as ImageIcon } from 'lucide-react';

interface TimelineItem {
  id: number;
  title: string;
  date: string;
  items: string[];
}

interface ManifestItem {
  title: string;
  posterUrl?: string;
}

export default function TimelineClient() {
  const [events, setEvents] = useState<TimelineItem[]>([]);
  const [postersMap, setPostersMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [timelineRes, manifestRes] = await Promise.all([
          fetch('/data/timeline.json'),
          fetch('/data/manifest.json')
        ]);
        
        const timelineData: TimelineItem[] = await timelineRes.json();
        const manifestData = await manifestRes.json();
        
        const map: Record<string, string> = {};
        if (manifestData.all && manifestData.all.movieList) {
          const sortedList = [...manifestData.all.movieList].sort((a: any, b: any) => b.title.length - a.title.length);
          for (const item of timelineData) {
            for (const timelineStr of item.items) {
              const strLower = timelineStr.toLowerCase();
              const matched = sortedList.find(m => 
                strLower.includes(m.title.toLowerCase()) || 
                (m.title.toLowerCase().includes("inside out") && strLower.includes("inside out")) ||
                (m.title.toLowerCase().includes("star wars") && strLower.includes("star wars")) ||
                (m.title.toLowerCase().includes("taylor swift") && strLower.includes("ts:")) ||
                (m.title.toLowerCase().includes("taylor swift") && strLower.includes("taylor swift"))
              );
              if (matched && matched.posterUrl) {
                map[timelineStr] = matched.posterUrl;
              }
            }
          }
        }
        
        setEvents(timelineData);
        setPostersMap(map);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching timeline:", err);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const years = useMemo(() => {
    const ySet = new Set<string>();
    events.forEach(e => {
      const match = e.date.match(/\d{4}/);
      if (match) ySet.add(match[0]);
    });
    return ["all", ...Array.from(ySet).sort()];
  }, [events]);

  const filteredEvents = useMemo(() => {
    if (selectedYear === "all") return events;
    return events.filter(e => e.date.includes(selectedYear));
  }, [events, selectedYear]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 font-sans p-4 sm:p-6 md:p-8">
      {/* Header */}
      <header className="mb-10 max-w-4xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-800 pb-6">
        <div>
          <Link href="/" className="inline-flex items-center text-gray-400 hover:text-white transition mb-4 text-sm font-medium">
            <ArrowLeft size={16} className="mr-2" />
            Volver al Dashboard
          </Link>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent flex items-center gap-3">
            <Calendar className="text-blue-500" size={32} />
            Línea de Tiempo
          </h1>
          <p className="text-gray-400 mt-2 text-sm md:text-base">
            Historial de tandas procesadas ({events.length} tandas).
          </p>
        </div>
        
        {/* Filters */}
        {!loading && years.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {years.map(y => (
              <button
                key={y}
                onClick={() => setSelectedYear(y)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                  selectedYear === y 
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40" 
                    : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white"
                }`}
              >
                {y === "all" ? "Todos los años" : y}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            No se encontraron eventos.
          </div>
        ) : (
          <div className="relative border-l-2 border-gray-800/80 ml-4 md:ml-6 pl-6 md:pl-10 space-y-12 pb-20">
            {filteredEvents.map((event, index) => {
              // Extract year for dividers
              const yearMatch = event.date.match(/\d{4}/);
              const eventYear = yearMatch ? yearMatch[0] : "";
              const prevEvent = index > 0 ? filteredEvents[index - 1] : null;
              const prevEventYear = prevEvent?.date.match(/\d{4}/)?.[0] || "";
              const showYearDivider = eventYear !== prevEventYear;

              return (
                <React.Fragment key={event.id}>
                  {showYearDivider && (
                    <div className="relative -ml-[45px] md:-ml-[61px] flex items-center gap-4 py-4 animate-fade-in">
                      <div className="w-12 h-12 rounded-full bg-gray-900 border-4 border-blue-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(59,130,246,0.5)] z-10">
                        <span className="text-sm font-bold text-blue-400">{eventYear}</span>
                      </div>
                      <div className="h-px bg-gradient-to-r from-blue-500/50 to-transparent flex-1"></div>
                    </div>
                  )}
                  
                  <div className="relative group animate-fade-in" style={{ animationDelay: `${Math.min(index * 30, 500)}ms` }}>
                    {/* Timeline Dot */}
                    <div className="absolute -left-[31px] md:-left-[47px] top-4 w-4 h-4 rounded-full bg-blue-500 border-4 border-gray-950 group-hover:bg-purple-400 group-hover:scale-125 group-hover:shadow-[0_0_10px_rgba(168,85,247,0.8)] transition-all duration-300 z-10"></div>
                    
                    {/* Event Content - Glassmorphism */}
                    <div className="bg-gray-900/40 backdrop-blur-md border border-gray-700/50 rounded-2xl p-5 md:p-6 shadow-xl shadow-black/40 hover:bg-gray-800/60 hover:border-purple-500/40 hover:-translate-y-1 transition-all duration-300">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-5">
                        <h3 className="text-2xl font-extrabold text-white group-hover:bg-gradient-to-r group-hover:from-blue-400 group-hover:to-purple-400 group-hover:bg-clip-text group-hover:text-transparent transition-all">
                          {event.title}
                        </h3>
                        <span className="text-sm font-semibold text-blue-300 bg-blue-950/50 border border-blue-800/50 px-3 py-1 rounded-full w-fit">
                          {event.date}
                        </span>
                      </div>
                      
                      {/* Collage / List */}
                      <div className="flex flex-col gap-4">
                        <div className="flex flex-wrap gap-3">
                          {event.items.map((item, i) => {
                            const poster = postersMap[item];
                            return (
                              <div key={i} className="flex items-center gap-3 bg-gray-950/50 rounded-xl p-2 border border-gray-800/60 hover:border-gray-600 transition-colors flex-1 min-w-[200px] max-w-sm">
                                {poster ? (
                                  <img src={poster} alt={item} className="w-10 h-14 object-cover rounded-md shadow-sm" />
                                ) : (
                                  <div className="w-10 h-14 bg-gray-800 rounded-md flex items-center justify-center text-gray-600">
                                    <ImageIcon size={18} />
                                  </div>
                                )}
                                <span className="text-sm font-medium text-gray-300 flex-1 leading-tight">{item}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
          </div>
        )}
      </main>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
          opacity: 0;
        }
      `}} />
    </div>
  );
}
