import os
import glob
import pypdf
import json
import re

dialogues_dir = r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\Di?logos"
manifest_path = r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data\manifest.json"

def has_letters(text):
    return bool(re.search(r'[a-zA-Z]', text))

def extract_movie_dialogues(pdf_path):
    print(f"Parsing movie PDF: {pdf_path}")
    count = 0
    try:
        reader = pypdf.PdfReader(pdf_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
            
        parts = text.split('-->')
        for part in parts[1:]:
            if has_letters(part):
                count += 1
    except Exception as e:
        print(f"Error parsing {pdf_path}: {e}")
    return count

# Load manifest
with open(manifest_path, 'r', encoding='utf-8') as f:
    manifest = json.load(f)

# Collect ONLY 2024 movie PDFs using glob wildcard to avoid encoding issues
movie_pdfs = glob.glob(os.path.join(r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\Di*logos", "Di*logos pelis 2024", "*.pdf"))

movie_dialogues_cache = {}
for pdf in movie_pdfs:
    filename = os.path.basename(pdf).lower()
    movie_dialogues_cache[filename] = extract_movie_dialogues(pdf)

overrides = {
    "escuadrón suicida": "suicide squad",
    "el escuadrón suicida": "the suicide squad",
    "aves de presa": "birds of prey",
    "intensamente 2": "inside out ii",
    "intensamente 1": "inside out",
    "intensamente": "inside out",
    "venganza implacable": "honest thief",
    "contrarreloj": "retribution",
    "el secreto de marrowbone": "marrowbone",
    "kim possible (película 2019)": "kim possible (2019)",
    "los increíbles": "the incredibles",
    "buscando a nemo": "finding nemo",
    "alvin y las ardillas": "alvin and the chipmunks"
}

def find_movie_dialogue_count(title):
    title_lower = title.lower().strip()
    
    # Apply override if exists
    if title_lower in overrides:
        search_key = overrides[title_lower]
    else:
        search_key = title_lower

    # First try exact match or direct inclusion
    for filename, count in movie_dialogues_cache.items():
        if search_key in filename:
            return count
            
    # Fallback to loose word match
    words = search_key.split()
    for filename, count in movie_dialogues_cache.items():
        if all(w in filename for w in words):
            return count

    return 0

# Update manifest
for cat_name, cat_data in manifest.items():
    if "movieList" not in cat_data: continue
    
    for item in cat_data["movieList"]:
        # Solo actualizar peliculas, skip episodes (series)
        if "episodes" in item and len(item["episodes"]) > 0:
            continue
            
        count = find_movie_dialogue_count(item["title"])
        if count > 0:
            item["dialogues"] = count

with open(manifest_path, 'w', encoding='utf-8') as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)

print("Dialogues successfully parsed for 2024 and added to manifest!")
