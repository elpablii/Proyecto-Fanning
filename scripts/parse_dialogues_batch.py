import os
import glob
import pypdf
import json
import re

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

with open(manifest_path, 'r', encoding='utf-8') as f:
    manifest = json.load(f)

movies_to_process = []
for item in manifest["2025"]["movieList"]:
    # Skip real series. Real series have episodes like "S01EP..." or "Episode 1"
    # Movies just have 1 episode with the same name, or we explicitly skip "Kim Possible"
    if item["title"] == "Kim Possible":
        continue
        
    if item.get("dialogues", 0) == 0:
        movies_to_process.append(item)

if not movies_to_process:
    print("No more movies to process in 2025!")
    exit(0)

print("Processing the following 15 movies:")
for m in movies_to_process:
    print(f"- {m['title']}")

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
    "alvin y las ardillas": "alvin and the chipmunks",
    "the beginning": "episode i the phantom menace",
    "star wars episode i": "episode i the phantom menace",
    "star wars episode ii": "episode ii attack of the clones",
    "i play rocky": "rocky",
    "i, tonya": "i-tonya",
    "goodbye christopher robin": "goodbye  christopher robin"
}

movie_pdfs = glob.glob(os.path.join(r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\Di*logos", "Di*logos pelis 2025", "*.pdf"))
movie_dialogues_cache = {}

for m in movies_to_process:
    title_lower = m["title"].lower().strip()
    search_key = overrides.get(title_lower, title_lower)
    words = search_key.split()
    
    matched_pdf = None
    # 1. Exact phrase match
    for pdf in movie_pdfs:
        filename = os.path.basename(pdf).lower()
        if search_key in filename:
            matched_pdf = pdf
            break
            
    # 2. All words match
    if not matched_pdf:
        for pdf in movie_pdfs:
            filename = os.path.basename(pdf).lower()
            if all(w in filename for w in words):
                matched_pdf = pdf
                break
                
    if matched_pdf:
        count = extract_movie_dialogues(matched_pdf)
        movie_dialogues_cache[m["title"]] = count
    else:
        print(f"Warning: PDF not found for {m['title']} (searched for {search_key})")

for item in movies_to_process:
    if item["title"] in movie_dialogues_cache:
        c = movie_dialogues_cache[item["title"]]
        item["dialogues"] = c
        if "episodes" in item and len(item["episodes"]) > 0:
            item["episodes"][0]["dialogues"] = c
            
# Sync to 'all'
d25 = {e["title"]: e.get("dialogues", 0) for e in manifest["2025"]["movieList"]}
for e in manifest["all"]["movieList"]:
    if e["title"] in d25 and d25[e["title"]] > 0:
        e["dialogues"] = d25[e["title"]]
        if "episodes" in e and len(e["episodes"]) > 0:
            e["episodes"][0]["dialogues"] = d25[e["title"]]

with open(manifest_path, 'w', encoding='utf-8') as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)

print("Batch successfully parsed and added to manifest!")
