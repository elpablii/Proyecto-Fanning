import os

file_path = r'c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\src\app\series\[slug]\page.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add state for tmdbEpisodes
state_hook = """  const [tmdbOverview, setTmdbOverview] = useState<string>('');
  const [tmdbEpisodes, setTmdbEpisodes] = useState<Record<number, any>>({});"""

content = content.replace("  const [tmdbOverview, setTmdbOverview] = useState<string>('');", state_hook)

# 2. Update TMDB fetch
tmdb_fetch_old = """    fetch(`https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(searchTitle)}&language=es-MX`)
      .then(res => res.json())
      .then(data => {
        if (data.results && data.results.length > 0) {
          const result = data.results.find((r: any) => r.backdrop_path && r.poster_path) || data.results[0];
          
          if (result) {
            setImages({
              backdrop: result.backdrop_path ? `https://image.tmdb.org/t/p/original${result.backdrop_path}` : '',
              poster: result.poster_path ? `https://image.tmdb.org/t/p/w500${result.poster_path}` : ''
            });
            if (result.overview) {
              setTmdbOverview(result.overview);
            }
          }
        }
      })
      .catch(console.error);"""

tmdb_fetch_new = """    fetch(`https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(searchTitle)}&language=es-MX`)
      .then(res => res.json())
      .then(data => {
        if (data.results && data.results.length > 0) {
          const result = data.results.find((r: any) => r.backdrop_path && r.poster_path) || data.results[0];
          
          if (result) {
            setImages({
              backdrop: result.backdrop_path ? `https://image.tmdb.org/t/p/original${result.backdrop_path}` : '',
              poster: result.poster_path ? `https://image.tmdb.org/t/p/w500${result.poster_path}` : ''
            });
            if (result.overview) {
              setTmdbOverview(result.overview);
            }

            // Fetch episodes details
            if (result.media_type === 'tv' || result.first_air_date) {
                // Fetch without language=es-MX to get original episode titles instead of generic "Episodio X"
                fetch(`https://api.themoviedb.org/3/tv/${result.id}?api_key=${apiKey}&append_to_response=season/1`)
                  .then(r => r.json())
                  .then(tvData => {
                      if (tvData['season/1'] && tvData['season/1'].episodes) {
                          const eps: Record<number, any> = {};
                          tvData['season/1'].episodes.forEach((ep: any) => {
                              eps[ep.episode_number] = {
                                  name: ep.name,
                                  still_path: ep.still_path ? `https://image.tmdb.org/t/p/w500${ep.still_path}` : null
                              };
                          });
                          setTmdbEpisodes(eps);
                      }
                  })
                  .catch(console.error);
            }
          }
        }
      })
      .catch(console.error);"""

content = content.replace(tmdb_fetch_old, tmdb_fetch_new)

# 3. Update the Episode Cards rendering
cards_old = """            {movieData.episodes.map((ep: any, idx: number) => (
              <div 
                key={idx} 
                className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-400/50 backdrop-blur-xl rounded-2xl p-6 transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.2)]"
              >
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity"></div>
                
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-semibold text-lg text-gray-100 group-hover:text-purple-300 transition-colors pr-4 line-clamp-2" title={ep.name}>
                      {ep.name.replace(decodedTitle, "").replace(/[()]/g, "").trim() || ep.name}
                    </h3>
                    <div className="bg-white/10 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                      Ep #{idx + 1}
                    </div>
                  </div>"""

cards_new = """            {movieData.episodes.map((ep: any, idx: number) => {
              const epMatch = ep.name.match(/(?:EP|Episode)\s*#?(\\d+)/i);
              const epNum = epMatch ? parseInt(epMatch[1]) : idx + 1;
              const tmdbEp = tmdbEpisodes[epNum];
              
              let displayName = ep.name.replace(decodedTitle, "").replace(/[()]/g, "").trim() || ep.name;
              if (tmdbEp && tmdbEp.name && !tmdbEp.name.startsWith("Episodio")) {
                  displayName = tmdbEp.name;
              }

              return (
              <div 
                key={idx} 
                className="group relative bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-400/50 backdrop-blur-xl rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] flex flex-col"
              >
                {/* Glow Effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                
                {/* Episode Image Cover */}
                {tmdbEp && tmdbEp.still_path && (
                  <div className="w-full h-40 relative overflow-hidden">
                    <img src={tmdbEp.still_path} alt={displayName} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/40 to-transparent"></div>
                    <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md text-white text-xs font-black px-3 py-1.5 rounded-full border border-white/10 shadow-lg">
                      Ep #{epNum}
                    </div>
                  </div>
                )}

                <div className="relative z-10 p-6 flex-1 flex flex-col">
                  {!tmdbEp?.still_path && (
                    <div className="flex justify-end mb-2">
                      <div className="bg-white/10 text-white text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                        Ep #{epNum}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between items-start mb-4 min-h-[56px]">
                    <h3 className="font-bold text-xl text-gray-100 group-hover:text-purple-300 transition-colors pr-4 line-clamp-2 leading-tight" title={displayName}>
                      {displayName}
                    </h3>
                  </div>"""

content = content.replace(cards_old, cards_new)

# Add closing bracket for map
closing_old = """                  )}
                </div>
              </div>
            ))}"""

closing_new = """                  )}
                </div>
              </div>
            )})}"""
            
content = content.replace(closing_old, closing_new)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Updated page.tsx with TMDB episode details")
