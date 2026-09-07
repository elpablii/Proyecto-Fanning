import fitz
import json
import os
import re

def extract_season_from_filename(filename):
    # Busca todas las ocurrencias de S(\d+)
    seasons = re.findall(r"S(\d+)EP", filename)
    if seasons:
        return [int(s) for s in seasons]
    return [1] # fallback

def process_kim_possible():
    base_dirs = ['../Vocabularios/2024', '../Vocabularios/2025', '../Vocabularios/2026']
    
    pdfs = []
    for d in base_dirs:
        if os.path.exists(d):
            for file in os.listdir(d):
                if file.startswith("Palabras desconocidas de Kim Possible (S") and file.endswith(".pdf"):
                    pdfs.append(os.path.join(d, file))
    
    episodes_data = {} 
    
    for pdf_path in sorted(pdfs):
        try:
            print(f"Processing: {pdf_path}")
            
            seasons_in_file = extract_season_from_filename(os.path.basename(pdf_path))
            current_season = seasons_in_file[0]
            
            doc = fitz.open(pdf_path)
            text = ""
            for page in doc:
                text += page.get_text()
                
            lines = text.split('\n')
            
            # Chequear si es un PDF individual (sin marcas "Episode X:" repetidas)
            # Para individuales a veces no dice "Episode X:" como separador, sino que solo trae el vocabulario.
            file_match = re.search(r"S(\d+)EP(\d+)", os.path.basename(pdf_path))
            current_ep_key = None
            if file_match and not '-' in os.path.basename(pdf_path) and not '&' in os.path.basename(pdf_path):
                season_str = file_match.group(1).zfill(2)
                ep_num_str = file_match.group(2).zfill(2)
                current_ep_key = f"S{season_str}E{ep_num_str}"
                episodes_data[current_ep_key] = {"name": current_ep_key, "vocabulary": [], "count": 0, "level": "B2", "expected_count": 0}
            
            last_ep_num = 0
            
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                    
                # Si encontramos un separador de episodio: "Episode X: Título (Y palabras)"
                ep_match = re.match(r"^Episode\s+(\d+)", line, re.IGNORECASE)
                if ep_match:
                    ep_num = int(ep_match.group(1))
                    
                    # Logica para cambio de temporada (si es archivo agrupado como S02EP30 & S03EP1)
                    if ep_num < last_ep_num and len(seasons_in_file) > 1:
                        # Asumimos que saltó a la siguiente temporada listada
                        if current_season == seasons_in_file[0]:
                            current_season = seasons_in_file[1]
                            
                    last_ep_num = ep_num
                    
                    season_str = str(current_season).zfill(2)
                    ep_num_str = str(ep_num).zfill(2)
                    current_ep_key = f"S{season_str}E{ep_num_str}"
                    
                    if current_ep_key not in episodes_data:
                        episodes_data[current_ep_key] = {"name": current_ep_key, "vocabulary": [], "count": 0, "level": "B2", "expected_count": 0}
                        
                    # Extraer el expected count si existe
                    count_match = re.search(r"\((\d+)\s+palabras", line, re.IGNORECASE)
                    if not count_match:
                        count_match = re.search(r"\((\d+)\s+words", line, re.IGNORECASE)
                    if count_match:
                        episodes_data[current_ep_key]["expected_count"] = int(count_match.group(1))
                        
                    continue
                
                if current_ep_key and ':' in line:
                    parts = line.split(':', 1)
                    word = parts[0].strip()
                    trans = parts[1].strip()
                    
                    if word.lower().startswith("episode "):
                        continue
                        
                    if word and trans and len(word) < 100:
                        episodes_data[current_ep_key]["vocabulary"].append({
                            "word": word,
                            "translation": trans
                        })
                        episodes_data[current_ep_key]["count"] += 1
                        
        except Exception as e:
            print(f"Error reading {pdf_path}: {e}")
            
    # Validar y reportar conteos
    for k, ep in episodes_data.items():
        if ep["expected_count"] > 0 and ep["count"] != ep["expected_count"]:
            print(f"Warning in {k}: Extracted {ep['count']} words, but expected {ep['expected_count']} based on PDF header.")
            
    sorted_episodes = [episodes_data[k] for k in sorted(episodes_data.keys())]
    
    # 1. Crear / Sobreescribir Kim Possible.json
    kim_possible_json = {
        "title": "Kim Possible",
        "overview": "La serie sigue las aventuras de Kim Possible, una adolescente que lidia con problemas cotidianos en la escuela secundaria mientras salva al mundo de supervillanos, acompañada por su torpe amigo Ron Imparable, su mascota Rufus y el genio informático Wade.",
        "englishAnalysis": "El lenguaje de Kim Possible presenta un vocabulario adolescente propio de la década de los 2000s, incluyendo expresiones de instituto (slang) combinadas con jerga de agentes secretos, misiones tácticas y planes malvados. Es ideal para practicar un inglés dinámico, juvenil y lleno de modismos informales.",
        "episodes": sorted_episodes
    }
    
    out_path = "public/data/pelis/Kim Possible.json"
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    
    # Eliminar 'expected_count' del JSON final
    for ep in kim_possible_json["episodes"]:
        if "expected_count" in ep:
            del ep["expected_count"]
            
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(kim_possible_json, f, ensure_ascii=False, indent=2)
    print(f"Generado {out_path} con {len(sorted_episodes)} episodios desglosados.")
    
    # 2. Actualizar manifest.json
    manifest_path = "public/data/manifest.json"
    if os.path.exists(manifest_path):
        with open(manifest_path, 'r', encoding='utf-8') as f:
            manifest = json.load(f)
            
        total_count = sum(ep["count"] for ep in sorted_episodes)
        
        manifest_episodes = []
        for ep in sorted_episodes:
            manifest_episodes.append({
                "name": ep["name"],
                "count": ep["count"],
                "level": ep["level"]
            })
            
        for i, m in enumerate(manifest.get("all", {}).get("movieList", [])):
            if m.get("title") == "Kim Possible" and m.get("type") == "series":
                manifest["all"]["movieList"][i]["episodes"] = manifest_episodes
                manifest["all"]["movieList"][i]["count"] = total_count
                break
                
        with open(manifest_path, 'w', encoding='utf-8') as f:
            json.dump(manifest, f, ensure_ascii=False, indent=2)
        print("manifest.json actualizado con éxito.")

if __name__ == "__main__":
    process_kim_possible()
