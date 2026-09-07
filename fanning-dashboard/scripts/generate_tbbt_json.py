import fitz
import json
import os
import re
import urllib.request
import difflib

API_KEY = "d1765b8dccaf994068c4055e49e80566"
TMDB_ID = 1418 # The Big Bang Theory

def get_json(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read())
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

def fetch_tmdb_data():
    tmdb_eng = []
    tmdb_spa = []
    
    # Bajamos temporadas de la 1 a la 6
    for lang, arr in [("en-US", tmdb_eng), ("es-MX", tmdb_spa)]:
        for s in range(1, 7):
            url = f"https://api.themoviedb.org/3/tv/{TMDB_ID}/season/{s}?api_key={API_KEY}&language={lang}"
            data = get_json(url)
            if data and "episodes" in data:
                for ep in data["episodes"]:
                    arr.append({
                        "season": s,
                        "episode_number": ep["episode_number"],
                        "name": ep["name"],
                        "overview": ep["overview"],
                        "still_path": ep.get("still_path")
                    })
    
    show_data = get_json(f"https://api.themoviedb.org/3/tv/{TMDB_ID}?api_key={API_KEY}&language=es-MX")
    show_overview = show_data.get("overview", "") if show_data else ""
    
    return tmdb_eng, tmdb_spa, show_overview

def process_pdfs():
    base_dirs = ['../Vocabularios/2024', '../Vocabularios/2025', '../Vocabularios/2026']
    pdfs = []
    for d in base_dirs:
        if os.path.exists(d):
            for file in os.listdir(d):
                if file.startswith("Palabras desconocidas de The Big Bang Theory") and file.endswith(".pdf"):
                    pdfs.append(os.path.join(d, file))
                    
    episodes_dict = {} 
    
    def extract_seasons_from_filename(fname):
        seasons = re.findall(r"S(\d+)EP", fname)
        return [int(s) for s in seasons]

    for pdf_path in sorted(pdfs):
        seasons_in_file = extract_seasons_from_filename(os.path.basename(pdf_path))
        if not seasons_in_file:
            continue
            
        current_season = seasons_in_file[0]
        
        doc = fitz.open(pdf_path)
        text = ""
        for page in doc:
            text += page.get_text()
            
        lines = text.split('\n')
        
        current_ep = None
        current_vocab = []
        last_ep_num = 0
        
        word_id = 1
        for line in lines:
            line = line.strip()
            if not line:
                continue
                
            # Buscar "Episode X: Título (Y palabras)"
            ep_match = re.match(r"^Episode\s+(\d+):\s*(.*?)\s*\(\d+\s+words?/phrases?\)", line, re.IGNORECASE)
            if not ep_match:
                # Intento con palabra en español u otro formato (por si acaso)
                ep_match = re.match(r"^Episode\s+(\d+):\s*(.*?)\s*\(\d+\s+palabras?", line, re.IGNORECASE)
                
            if ep_match:
                # Guardar el anterior
                if current_ep:
                    episodes_dict[current_ep["key"]] = current_ep
                    
                ep_num = int(ep_match.group(1))
                
                # Manejar S01EP17 & S02EP1-3
                if ep_num < last_ep_num and len(seasons_in_file) > 1:
                    if current_season == seasons_in_file[0]:
                        current_season = seasons_in_file[1]
                elif len(seasons_in_file) > 1 and ep_num == 1:
                    # si es 1 pero veniamos de 17, entonces pasamos a la sig temp
                    if last_ep_num > 10:
                        if current_season == seasons_in_file[0]:
                            current_season = seasons_in_file[1]
                            
                last_ep_num = ep_num
                ep_key = f"S{str(current_season).zfill(2)}E{str(ep_num).zfill(2)}"
                
                current_ep = {
                    "key": ep_key,
                    "name": ep_key,
                    "title": ep_match.group(2).strip(),
                    "vocabulary": [],
                    "season": current_season,
                    "ep_num": ep_num
                }
                current_vocab = current_ep["vocabulary"]
                word_id = 1
                continue
                
            # Parsing vocabulary: "Word: translation"
            # It could be anything before a colon, but let's avoid "Episode X:" which is already caught
            if current_ep and ":" in line:
                parts = line.split(":", 1)
                word = parts[0].strip()
                translation = parts[1].strip()
                
                # A veces el pdf de TBBT tiene guion?
                if not word.lower().startswith("episode "):
                    current_vocab.append({
                        "id": word_id,
                        "word": word,
                        "translation": translation
                    })
                    word_id += 1
            elif current_ep and len(current_vocab) > 0 and not ":" in line and not line.lower().startswith("episode "):
                # Append to the previous translation if multiline
                current_vocab[-1]["translation"] += " " + line
        
        # Guardar el ultimo
        if current_ep:
            episodes_dict[current_ep["key"]] = current_ep
            
    # Ordenar por llave (S01E01, S01E02, ...)
    sorted_keys = sorted(list(episodes_dict.keys()))
    
    return [episodes_dict[k] for k in sorted_keys]

def run():
    print("Fetching TMDB data for TBBT...")
    tmdb_eng, tmdb_spa, show_overview = fetch_tmdb_data()
    
    print("Extracting episodes from PDFs...")
    episodes_list = process_pdfs()
    
    print(f"Total episodes extracted: {len(episodes_list)}")
    
    tmdb_spa_dict = {f"S{ep['season']}E{ep['episode_number']}": ep for ep in tmdb_spa}
    
    tmdb_global = {
        "overview": show_overview,
        "episodes": {}
    }
    
    final_episodes = []
    
    for i, ep_local in enumerate(episodes_list):
        ep_id = ep_local["name"]
        pdf_title = ep_local["title"]
        
        del ep_local["key"]
        del ep_local["title"]
        del ep_local["season"]
        del ep_local["ep_num"]
        
        best_match = None
        best_ratio = 0
        
        if pdf_title:
            clean_pdf = pdf_title.split(' (')[0].strip().lower()
            for tmdb_e in tmdb_eng:
                ratio = difflib.SequenceMatcher(None, clean_pdf, tmdb_e["name"].lower()).ratio()
                if ratio > best_ratio:
                    best_ratio = ratio
                    best_match = tmdb_e
                    
        match_spa = None
        if best_ratio > 0.85 and best_match:
            match_spa = next((e for e in tmdb_spa if e["season"] == best_match["season"] and e["episode_number"] == best_match["episode_number"]), None)
        else:
            season_n = int(ep_id[1:3])
            ep_n = int(ep_id[4:6])
            match_spa = tmdb_spa_dict.get(f"S{season_n}E{ep_n}")

        if match_spa:
            eng_name = pdf_title if pdf_title else (best_match["name"] if best_match else match_spa["name"])
            tmdb_global["episodes"][str(i + 1)] = {
                "name": eng_name,
                "overview": match_spa["overview"],
                "still_path": "https://image.tmdb.org/t/p/w500" + match_spa["still_path"] if match_spa.get("still_path") else ""
            }
        else:
            tmdb_global["episodes"][str(i + 1)] = {
                "name": pdf_title or ep_id,
                "overview": "Sin sinopsis disponible.",
                "still_path": ""
            }
            
        final_episodes.append(ep_local)

    total_words = sum(len(ep["vocabulary"]) for ep in final_episodes)
    
    english_analysis = "El inglés de The Big Bang Theory se caracteriza por un amplio uso de vocabulario científico, términos de la cultura pop y jerga geek. Sheldon y Leonard utilizan estructuras gramaticales complejas y un léxico académico y muy formal, lo que resulta excelente para expandir tu vocabulario avanzado. Por otro lado, Penny aporta expresiones cotidianas y modismos informales comunes. Es una serie ideal para estudiantes que buscan llevar su inglés a un nivel B2/C1, dominando tanto el registro formal técnico como el habla coloquial americana."
    
    data = {
        "title": "The Big Bang Theory",
        "overview": show_overview,
        "englishAnalysis": english_analysis,
        "count": total_words,
        "level": "B2",
        "rating": "TE",
        "dialogues": 29596, 
        "tmdb": tmdb_global,
        "episodes": final_episodes
    }
    
    json_path = "public/data/pelis/The Big Bang Theory.json"
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        
    print(f"Saved {json_path} with {len(final_episodes)} episodes.")

if __name__ == "__main__":
    run()
