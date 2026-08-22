import fs from 'fs';
import path from 'path';

// Reusing tmdbOverrides logic
const tmdbOverrides: Record<string, { q: string, y?: string, id?: string, tv?: boolean }> = {
    "ámsterdam": { q: "Amsterdam", y: "2022" },
    "el escuadrón suicida": { q: "The Suicide Squad", y: "2021" },
    "riesgo bajo cero": { q: "The Ice Road", id: "646207" },
    "los fantasmas de scrooge": { q: "A Christmas Carol", y: "2009" },
    "buscando a nemo": { q: "Finding Nemo", y: "2003" },
    "a complete unknown": { q: "A Complete Unknown", y: "2024" },
    "orgullo y prejuicio": { q: "Pride & Prejudice", y: "2005" },
    "interestellar": { q: "Interstellar", y: "2014" },
    "taylor swift - the eras tour film the final show": { q: "Taylor Swift: The Eras Tour", id: "1562010" },
    "birds of prey": { q: "Birds of Prey", id: "495764" },
    "aves de presa": { q: "Birds of Prey", id: "495764" },
    "terminal": { q: "Terminal", id: "385332" },
    "escuadrón suicida": { q: "Suicide Squad", id: "297761" },
    "suicide squad": { q: "Suicide Squad", id: "297761" },
    "amsterdam": { q: "Amsterdam", id: "664469" },
    "babylon": { q: "Babylon", id: "615777" },
    "the legend of tarzan": { q: "The Legend of Tarzan", id: "258489" },
    "toy story": { q: "Toy Story", id: "862" },
    "toy story i": { q: "Toy Story", id: "862" },
    "harold and the purple crayon": { q: "Harold and the Purple Crayon", id: "826510" },
    "retribution": { q: "Retribution", id: "762430" },
    "contrarreloj": { q: "Retribution", id: "762430" },
    "emma": { q: "Emma", id: "556678" },
    "a christmas carol": { q: "A Christmas Carol", id: "17979" },
    "finding nemo": { q: "Finding Nemo", id: "12" },
    "top gun": { q: "Top Gun", id: "744" },
    "cuckoo": { q: "Cuckoo", id: "869291" },
    "the runaways": { q: "The Runaways", id: "27586" },
    "3 generations": { q: "3 Generations", id: "300667" },
    "about ray": { q: "3 Generations", id: "300667" },
    "teen spirit": { q: "Teen Spirit", id: "440918" },
    "vicious": { q: "Vicious", id: "1251717" },
    "pride & prejudice": { q: "Pride & Prejudice", id: "4348" },
    "interstellar": { q: "Interstellar", id: "157336" },
    "taylor swift the eras tour the final show": { q: "Taylor Swift: The Eras Tour", id: "1562010" },
    "marlowe": { q: "Marlowe", id: "844417" },
    "work it": { q: "Work It", id: "612706" },
    "home": { q: "Home", id: "62320" },
    "the witch": { q: "The Witch", id: "310131" },
    "sleeping beauty": { q: "Sleeping Beauty", id: "10882" },
    "la bella durmiente": { q: "Sleeping Beauty", id: "10882" },
    "barry": { q: "Barry", id: "397717" },
    "night moves": { q: "Night Moves", id: "157823" },
    "cinderella": { q: "Cinderella", id: "11224" },
    "cenicienta": { q: "Cinderella", id: "11224" },
    "the muppet show with sabrina carpenter": { q: "The Muppet Show", id: "1548113" },
    "unknown": { q: "Unknown", id: "48138" },
    "gambito de dama": { q: "The Queen's Gambit", tv: true },
    "the girl from plainville": { q: "The Girl from Plainville", tv: true },
    "the perfect couple": { q: "The Perfect Couple", y: "2024", tv: true },
    "kim possible (2019)": { q: "Kim Possible", y: "2019" },
    "kim possible (película 2019)": { q: "Kim Possible", y: "2019" },
    "kim possible (pelicula 2019)": { q: "Kim Possible", y: "2019" },
    "lilo and stitch i": { q: "Lilo & Stitch", y: "2002" },
    "lilo and stitch ii": { q: "Lilo & Stitch 2", y: "2005" },
    "monsters inc": { q: "Monsters, Inc.", y: "2001" },
    "wall-e": { q: "WALL·E", y: "2008" },
    "bichos una aventura en miniatura": { q: "A Bug's Life", y: "1998" },
    "los increibles": { q: "The Incredibles", y: "2004" },
    "gta san andreas the introduction": { q: "The Introduction", y: "2004" },
    "alvin y las ardillas": { q: "Alvin and the Chipmunks", y: "2007" },
    "barbie la princesa y estrella de pop": { q: "Barbie: The Princess & the Popstar", y: "2012" },
    "star wars episodio i the phantom menace": { q: "Star Wars: Episode I - The Phantom Menace", y: "1999" },
    "star wars episodio ii attack of the clones": { q: "Star Wars: Episode II - Attack of the Clones", y: "2002" },
    "star wars episodio iii revenge of the sith": { q: "Star Wars: Episode III - Revenge of the Sith", y: "2005" },
    "star wars episodio iv a new hope": { q: "Star Wars", y: "1977" },
    "star wars episodio v the empire strikes back": { q: "The Empire Strikes Back", y: "1980" },
    "star wars episodio vi return of the jedi": { q: "Return of the Jedi", y: "1983" },
    "taylor swift folklore the long pond studio sessions": { q: "folklore: the long pond studio sessions", y: "2020" },
    "taylor swift the 1989 world tour": { q: "The 1989 World Tour - Live", y: "2015" },
    "taylor swift the eras tour film the final show": { q: "Taylor Swift: The Eras Tour", y: "2023" },
    "taylor swift the eras tour film": { q: "Taylor Swift: The Eras Tour", y: "2023" },
    "venganza implacable": { q: "Honest Thief", y: "2020" },
    "toy story 2": { q: "Toy Story 2", y: "1999" },
    "toy story iii": { q: "Toy Story 3", y: "2010" },
    "toy story iv": { q: "Toy Story 4", y: "2019" },
    "cars iii": { q: "Cars 3", y: "2017" },
    "minions i": { q: "Minions", y: "2015" },
    "rambo first blood": { q: "First Blood", y: "1982" },
    "rambo ii": { q: "Rambo: First Blood Part II", y: "1985" },
    "rambo iii": { q: "Rambo III", y: "1988" },
    "rambo iv": { q: "Rambo", y: "2008" },
    "rambo last blood": { q: "Rambo: Last Blood", y: "2019" },
    "rocky i": { q: "Rocky", y: "1976" },
    "rocky ii": { q: "Rocky II", y: "1979" },
    "rocky iii": { q: "Rocky III", y: "1982" },
    "rocky iv": { q: "Rocky IV", y: "1985" },
    "maleficent i": { q: "Maleficent", y: "2014" },
    "maleficent ii mistress of evil": { q: "Maleficent: Mistress of Evil", y: "2019" },
    "taken i": { q: "Taken", y: "2008" },
    "taken ii": { q: "Taken 2", y: "2012" },
    "taken iii": { q: "Taken 3", y: "2014" },
    "tall girl i": { q: "Tall Girl", y: "2019" },
    "tall girl ii": { q: "Tall Girl 2", y: "2022" },
    "the muppet show": { q: "The Muppet Show", tv: true },
    "zootopia+": { q: "Zootopia+", tv: true },
    "zootopia i": { q: "Zootopia", y: "2016" },
    "euphoria s1": { q: "Euphoria", tv: true },
    "euphoria s2": { q: "Euphoria", tv: true },
    "kim possible todo un drama": { q: "Kim Possible: So the Drama", y: "2005" },
    "the watches": { q: "The Watchers", y: "2024" },
    "el padrino i": { q: "The Godfather", y: "1972" },
    "five nights at freddy's ii": { q: "Five Nights at Freddy's 2", y: "2025" },
    "mary queen of scots": { q: "Mary Queen of Scots", y: "2018" },
    "olivia rodrigo driving home 2 u": { q: "Olivia Rodrigo: driving home 2 u", y: "2022" },
    "olivia rodrigo guts world tour": { q: "Olivia Rodrigo: GUTS World Tour", y: "2024" },
    "taylor swift city of lover concert": { q: "Taylor Swift: City of Lover Concert", y: "2020" },
    "taylor swift miss americana": { q: "Miss Americana", y: "2020" },
    "taylor swift reputation stadium tour": { q: "Taylor Swift: Reputation Stadium Tour", y: "2018" },
    "super mario bros the movie": { q: "The Super Mario Bros. Movie", y: "2023" }
};

const TMDB_API_KEY = process.env.NEXT_PUBLIC_TMDB_API_KEY || 'd1765b8dccaf994068c4055e49e80566';
const BASE_URL = 'https://api.themoviedb.org/3';

async function fetchTMDB(title: string, type: 'movie' | 'series') {
    let searchTitle = title;
    let endpoint = type === 'series' ? 'search/tv' : 'search/multi';
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
    let mediaType = type === 'series' ? 'tv' : 'movie';

    if (directId) {
        const typeEndpoint = (type === 'series' || mediaType === 'tv') ? 'tv' : 'movie';
        const res = await fetch(`${BASE_URL}/${typeEndpoint}/${directId}?api_key=${TMDB_API_KEY}&language=en-US`);
        finalData = await res.json();
        mediaType = typeEndpoint;
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

    let finalOverview = finalData?.overview || null;
    let enPoster = finalData?.poster_path;
    let enBackdrop = finalData?.backdrop_path;
    let photos: string[] = [];
    let episodes: any = null;

    if (finalData) {
        // Spanish Overview
        try {
            const esRes = await fetch(`${BASE_URL}/${mediaType}/${finalData.id}?api_key=${TMDB_API_KEY}&language=es-MX`);
            const esJson = await esRes.json();
            if (esJson.overview && esJson.overview.trim() !== '') {
                finalOverview = esJson.overview;
            } else if (finalOverview) {
                try {
                    const transRes = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=${encodeURIComponent(finalOverview)}`);
                    const transJson = await transRes.json();
                    if (transJson && transJson[0]) {
                        finalOverview = transJson[0].map((t: any) => t[0]).join('');
                    }
                } catch(e) {}
            }
        } catch (e) {}

        // English Photos
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
        } catch (e) {}

        // Episodes
        if (type === 'series') {
            try {
                const tvRes = await fetch(`${BASE_URL}/tv/${finalData.id}?api_key=${TMDB_API_KEY}&append_to_response=season/1`);
                const tvData = await tvRes.json();
                if (tvData['season/1'] && tvData['season/1'].episodes) {
                    episodes = {};
                    tvData['season/1'].episodes.forEach((ep: any) => {
                        episodes[ep.episode_number] = {
                            name: ep.name,
                            still_path: ep.still_path ? `https://image.tmdb.org/t/p/w500${ep.still_path}` : null
                        };
                    });
                }
            } catch (e) {}
        }
    }

    return {
        posterUrl: enPoster ? `https://image.tmdb.org/t/p/w500${enPoster}` : null,
        backdropUrl: enBackdrop ? `https://image.tmdb.org/t/p/original${enBackdrop}` : null,
        overview: finalOverview || 'Sinopsis no disponible.',
        photos,
        episodes
    };
}

async function main() {
    console.log("Reading manifest.json...");
    const manifestPath = path.join(process.cwd(), 'public/data/manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    const movies = manifest.all.movieList;
    for (let i = 0; i < movies.length; i++) {
        const item = movies[i];
        console.log(`[${i+1}/${movies.length}] Fetching TMDB for: ${item.title}`);
        
        try {
            const tmdbData = await fetchTMDB(item.title, item.type || 'movie');
            
            // Add poster and backdrop to manifest item
            item.posterUrl = tmdbData.posterUrl;
            item.backdropUrl = tmdbData.backdropUrl;

            // Save details to individual JSON
            const jsonPath = path.join(process.cwd(), `public/data/pelis/${item.title}.json`);
            if (fs.existsSync(jsonPath)) {
                const fileData = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
                fileData.tmdb = {
                    overview: tmdbData.overview,
                    photos: tmdbData.photos,
                    episodes: tmdbData.episodes
                };
                fs.writeFileSync(jsonPath, JSON.stringify(fileData, null, 2));
            }
        } catch (error) {
            console.error(`Error processing ${item.title}:`, error);
        }
        
        // Add a small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 200));
    }

    console.log("Writing updated manifest.json...");
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log("Done!");
}

main().catch(console.error);
