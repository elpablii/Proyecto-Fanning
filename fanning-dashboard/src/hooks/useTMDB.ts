import { useState, useEffect } from 'react';
import { tmdbOverrides } from '@/lib/tmdb';

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || 'd1765b8dccaf994068c4055e49e80566';
const BASE_URL = 'https://api.themoviedb.org/3';

type TMDBResult = {
    posterUrl: string | null;
    backdropUrl: string | null;
    overview: string | null;
    photos: string[];
    episodes: Record<number, { name: string, still_path: string | null }>;
    loading: boolean;
};

export function useTMDB(title: string, options?: { type?: 'movie' | 'series', fetchDetails?: boolean, fetchEpisodes?: boolean, fetchPhotos?: boolean }): TMDBResult {
    const [result, setResult] = useState<TMDBResult>({
        posterUrl: null,
        backdropUrl: null,
        overview: null,
        photos: [],
        episodes: {},
        loading: true
    });

    useEffect(() => {
        if (!title) {
            setResult(prev => ({ ...prev, loading: false }));
            return;
        }

        let isMounted = true;
        setResult(prev => ({ ...prev, loading: true }));

        const fetchData = async () => {
            try {
                // 1. Check for manual overrides in localStorage (for MovieCard / basic views)
                try {
                    const savedOverridesStr = localStorage.getItem('tmdb_manual_overrides');
                    if (savedOverridesStr) {
                        const savedOverrides = JSON.parse(savedOverridesStr);
                        if (savedOverrides[title]) {
                            const res = await fetch(`${BASE_URL}/movie/${savedOverrides[title]}?api_key=${TMDB_API_KEY}&language=es-MX`);
                            const data = await res.json();
                            if (isMounted) {
                                setResult(prev => ({
                                    ...prev,
                                    posterUrl: data.poster_path ? `https://image.tmdb.org/t/p/w500${data.poster_path}` : null,
                                    backdropUrl: data.backdrop_path ? `https://image.tmdb.org/t/p/original${data.backdrop_path}` : null,
                                    overview: data.overview || null,
                                    loading: false
                                }));
                            }
                            return; // Stop if manual override succeeded
                        }
                    }
                } catch (e) {
                    console.error("Error leyendo manual overrides", e);
                }

                // 2. Resolve searchTitle, endpoint, and directId from tmdbOverrides dictionary
                let searchTitle = title;
                let endpoint = options?.type === 'series' ? 'search/tv' : 'search/multi';
                let extraParams = '';
                let directId: string | null = null;
                const lowerTitle = title.toLowerCase().trim();
                const sortedKeys = Object.keys(tmdbOverrides).sort((a, b) => b.length - a.length);

                for (const key of sortedKeys) {
                    if (lowerTitle.includes(key)) {
                        searchTitle = tmdbOverrides[key].q;
                        if (tmdbOverrides[key].id) {
                            directId = tmdbOverrides[key].id || null;
                        }
                        if (tmdbOverrides[key].y) {
                            if (tmdbOverrides[key].tv) {
                                endpoint = 'search/tv';
                                extraParams = `&first_air_date_year=${tmdbOverrides[key].y}`;
                            } else {
                                endpoint = 'search/movie';
                                extraParams = `&primary_release_year=${tmdbOverrides[key].y}`;
                            }
                        } else if (tmdbOverrides[key].tv) {
                            endpoint = 'search/tv';
                        }
                        break;
                    }
                }

                let finalData: any = null;
                let mediaType = options?.type === 'series' ? 'tv' : 'movie';

                // 3. Fetch Data in English for original artwork
                if (directId) {
                    const res = await fetch(`${BASE_URL}/movie/${directId}?api_key=${TMDB_API_KEY}&language=en-US`);
                    finalData = await res.json();
                    mediaType = 'movie'; // forced by movie/directId
                } else {
                    const searchRes = await fetch(`${BASE_URL}/${endpoint}?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchTitle)}&language=en-US${extraParams}`);
                    const searchData = await searchRes.json();
                    
                    if (searchData.results && searchData.results.length > 0) {
                        finalData = searchData.results.find((r: any) => r.poster_path || r.backdrop_path) || searchData.results[0];
                        if (finalData.media_type) {
                            mediaType = finalData.media_type;
                        } else if (finalData.first_air_date) {
                            mediaType = 'tv';
                        }
                    }
                }

                // 4. Advanced Processing (Spanish Overview and Photos)
                let finalOverview = finalData?.overview || null;
                let enPoster = finalData?.poster_path;
                let enBackdrop = finalData?.backdrop_path;
                let photos: string[] = [];

                if (finalData && options?.fetchDetails) {
                    // Fetch Spanish overview explicitly
                    try {
                        const esRes = await fetch(`${BASE_URL}/${mediaType}/${finalData.id}?api_key=${TMDB_API_KEY}&language=es-MX`);
                        const esJson = await esRes.json();
                        
                        if (esJson.overview && esJson.overview.trim() !== '') {
                            finalOverview = esJson.overview;
                        } else if (finalOverview) {
                            // Translate English fallback to Spanish using Google Translate
                            try {
                                const transRes = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=${encodeURIComponent(finalOverview)}`);
                                const transJson = await transRes.json();
                                if (transJson && transJson[0]) {
                                    finalOverview = transJson[0].map((t: any) => t[0]).join('');
                                }
                            } catch(e) {
                                // Keep English overview as fallback
                            }
                        }
                    } catch (e) {
                        console.error("Error fetching Spanish overview", e);
                    }

                    // Fetch photos
                    if (options?.fetchPhotos) {
                        try {
                            const imagesRes = await fetch(`${BASE_URL}/${mediaType}/${finalData.id}/images?api_key=${TMDB_API_KEY}&include_image_language=en,null`);
                            const imagesJson = await imagesRes.json();
                            if (imagesJson.posters && imagesJson.posters.length > 0) {
                                enPoster = imagesJson.posters[0].file_path;
                            }
                            if (imagesJson.backdrops && imagesJson.backdrops.length > 0) {
                                enBackdrop = imagesJson.backdrops[0].file_path;
                                photos = imagesJson.backdrops.slice(0, 6).map((img: any) => `https://image.tmdb.org/t/p/w780${img.file_path}`);
                            }
                        } catch (e) {
                            console.error("Error fetching images", e);
                        }
                    }
                }

                // 4. Update state with basic results
                if (finalData && isMounted) {
                    setResult(prev => ({
                        ...prev,
                        posterUrl: enPoster ? `https://image.tmdb.org/t/p/w500${enPoster}` : null,
                        backdropUrl: enBackdrop ? `https://image.tmdb.org/t/p/original${enBackdrop}` : null,
                        overview: finalOverview || 'Sinopsis no disponible.',
                        photos: photos,
                        loading: !options?.fetchEpisodes // finished if we don't need episodes
                    }));

                    // 5. Fetch episodes if requested and it's a TV show
                    if (options?.fetchEpisodes && mediaType === 'tv') {
                        try {
                            const tvRes = await fetch(`${BASE_URL}/tv/${finalData.id}?api_key=${TMDB_API_KEY}&append_to_response=season/1`);
                            const tvData = await tvRes.json();
                            
                            if (tvData['season/1'] && tvData['season/1'].episodes) {
                                const eps: Record<number, { name: string, still_path: string | null }> = {};
                                tvData['season/1'].episodes.forEach((ep: any) => {
                                    eps[ep.episode_number] = {
                                        name: ep.name,
                                        still_path: ep.still_path ? `https://image.tmdb.org/t/p/w500${ep.still_path}` : null
                                    };
                                });
                                if (isMounted) {
                                    setResult(prev => ({ ...prev, episodes: eps, loading: false }));
                                }
                            } else {
                                if (isMounted) setResult(prev => ({ ...prev, loading: false }));
                            }
                        } catch (err) {
                            console.error("Error fetching tv episodes", err);
                            if (isMounted) setResult(prev => ({ ...prev, loading: false }));
                        }
                    } else if (options?.fetchEpisodes) {
                        if (isMounted) setResult(prev => ({ ...prev, loading: false }));
                    }
                } else {
                    if (isMounted) setResult(prev => ({ ...prev, loading: false }));
                }

            } catch (error) {
                console.error("Error fetching from TMDB", error);
                if (isMounted) setResult(prev => ({ ...prev, loading: false }));
            }
        };

        fetchData();

        return () => {
            isMounted = false;
        };
    }, [title, options?.type, options?.fetchEpisodes]);

    return result;
}
