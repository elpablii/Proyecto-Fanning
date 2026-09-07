import fitz
import json
import os
import re
import urllib.request
import difflib

API_KEY = "d1765b8dccaf994068c4055e49e80566"
TMDB_ID = 2345

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
    
    for lang, arr in [("en-US", tmdb_eng), ("es-MX", tmdb_spa)]:
        for s in [0, 1, 2, 3, 4]:
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
    
    # Overview general
    show_data = get_json(f"https://api.themoviedb.org/3/tv/{TMDB_ID}?api_key={API_KEY}&language=es-MX")
    show_overview = show_data.get("overview", "") if show_data else ""
    
    return tmdb_eng, tmdb_spa, show_overview

def extract_titles_from_pdfs():
    base_dirs = ['../Vocabularios/2024', '../Vocabularios/2025', '../Vocabularios/2026']
    pdfs = []
    for d in base_dirs:
        if os.path.exists(d):
            for file in os.listdir(d):
                if file.startswith("Palabras desconocidas de Kim Possible (S") and file.endswith(".pdf"):
                    pdfs.append(os.path.join(d, file))
                    
    titles = {}
    
    def extract_season(fname):
        seasons = re.findall(r"S(\d+)EP", fname)
        return [int(s) for s in seasons] if seasons else [1]

    for pdf_path in sorted(pdfs):
        seasons_in_file = extract_season(os.path.basename(pdf_path))
        current_season = seasons_in_file[0]
        
        doc = fitz.open(pdf_path)
        text = ""
        for page in doc:
            text += page.get_text()
            
        lines = text.split('\n')
        
        # Para individuales sin marcador interno
        file_match = re.search(r"S(\d+)EP(\d+)", os.path.basename(pdf_path))
        if file_match and not '-' in os.path.basename(pdf_path) and not '&' in os.path.basename(pdf_path):
            s = int(file_match.group(1))
            e = int(file_match.group(2))
            ep_key = f"S{str(s).zfill(2)}E{str(e).zfill(2)}"
            
            # Buscar el titulo en la primera linea
            title = ""
            for line in lines[:20]:
                m = re.search(r"Episode \d+:\s*(.*?)\s*\(", line, re.IGNORECASE)
                if m:
                    title = m.group(1).strip()
                    break
            titles[ep_key] = title
            
        last_ep_num = 0
        for line in lines:
            line = line.strip()
            ep_match = re.match(r"^Episode\s+(\d+):\s*(.*?)\s*\(", line, re.IGNORECASE)
            if ep_match:
                ep_num = int(ep_match.group(1))
                if ep_num < last_ep_num and len(seasons_in_file) > 1:
                    if current_season == seasons_in_file[0]:
                        current_season = seasons_in_file[1]
                last_ep_num = ep_num
                ep_key = f"S{str(current_season).zfill(2)}E{str(ep_num).zfill(2)}"
                titles[ep_key] = ep_match.group(2).strip()

    # Si para algún episodio individual no sacó título con el regex "Episode \d+:", usar fallback
    for pdf_path in sorted(pdfs):
        file_match = re.search(r"S(\d+)EP(\d+)", os.path.basename(pdf_path))
        if file_match and not '-' in os.path.basename(pdf_path) and not '&' in os.path.basename(pdf_path):
            s = str(file_match.group(1)).zfill(2)
            e = str(file_match.group(2)).zfill(2)
            k = f"S{s}E{e}"
            if not titles.get(k):
                doc = fitz.open(pdf_path)
                lines = doc[0].get_text().split('\n')
                for line in lines[:10]:
                    m = re.search(r"Episode \d+:\s*(.*?)\)", line, re.IGNORECASE)
                    if m:
                        titles[k] = m.group(1).strip()
                        break
                        
    return titles

def run():
    print("Fetching TMDB data...")
    tmdb_eng, tmdb_spa, show_overview = fetch_tmdb_data()
    
    print("Extracting titles from PDFs...")
    local_titles = extract_titles_from_pdfs()
    
    json_path = "public/data/pelis/Kim Possible.json"
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    data["overview"] = show_overview
    
    # Crear un diccionario para facil acceso a TMDB spa por (season, episode)
    tmdb_spa_dict = {f"S{ep['season']}E{ep['episode_number']}": ep for ep in tmdb_spa}
    
    # Casos especiales manuales para Kim Possible
    sitch_in_time_spa = None
    for ep in tmdb_spa:
        if "sitch in time" in ep["name"].lower() or "viajes en el tiempo" in ep["name"].lower() or "problema en el tiempo" in ep["name"].lower():
            sitch_in_time_spa = ep
            break
    if not sitch_in_time_spa:
        for ep in tmdb_eng:
            if "sitch in time" in ep["name"].lower():
                sitch_in_time_spa = next((e for e in tmdb_spa if e["season"] == ep["season"] and e["episode_number"] == ep["episode_number"]), None)
                break
                
    mapped_count = 0
    
    for ep_local in data["episodes"]:
        ep_id = ep_local["name"] # ej S01E01
        pdf_title = local_titles.get(ep_id, "")
        
        # Regla especial: si es A Sitch in Time
        if "sitch in time" in pdf_title.lower() and sitch_in_time_spa:
            part = ""
            if "part 1" in pdf_title.lower() or "present" in pdf_title.lower(): part = " (Parte 1)"
            elif "part 2" in pdf_title.lower() or "past" in pdf_title.lower(): part = " (Parte 2)"
            elif "part 3" in pdf_title.lower() or "future" in pdf_title.lower(): part = " (Parte 3)"
            
            ep_local["tmdb"] = {
                "name": sitch_in_time_spa["name"] + part,
                "overview": sitch_in_time_spa["overview"],
                "still_path": "https://image.tmdb.org/t/p/w500" + sitch_in_time_spa["still_path"] if sitch_in_time_spa.get("still_path") else ""
            }
            mapped_count += 1
            continue

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
        if best_ratio > 0.8 and best_match:
            match_spa = next((e for e in tmdb_spa if e["season"] == best_match["season"] and e["episode_number"] == best_match["episode_number"]), None)
        else:
            season_n = int(ep_id[1:3])
            ep_n = int(ep_id[4:6])
            if season_n == 2:
                if ep_n >= 16:
                    ep_n -= 1
            match_spa = tmdb_spa_dict.get(f"S{season_n}E{ep_n}")

        if match_spa:
            eng_name = pdf_title if pdf_title else (best_match["name"] if best_match else match_spa["name"])
            ep_local["tmdb"] = {
                "name": eng_name,
                "overview": match_spa["overview"],
                "still_path": "https://image.tmdb.org/t/p/w500" + match_spa["still_path"] if match_spa.get("still_path") else ""
            }
            mapped_count += 1
        else:
            ep_local["tmdb"] = {
                "name": pdf_title or ep_id,
                "overview": "Sin sinopsis disponible.",
                "still_path": ""
            }

    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        
    print(f"Mapped {mapped_count} out of {len(data['episodes'])} episodes.")

if __name__ == "__main__":
    run()
