import os
import glob
import pypdf
import json
import re

dialogues_dir = r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\Diálogos"
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

# Collect ONLY 2023 movie PDFs
movie_pdfs = glob.glob(os.path.join(dialogues_dir, "Diálogos pelis 2023", "*.pdf"))

movie_dialogues_cache = {}
for pdf in movie_pdfs:
    filename = os.path.basename(pdf).lower()
    movie_dialogues_cache[filename] = extract_movie_dialogues(pdf)

def find_movie_dialogue_count(title):
    title_lower = title.lower()
    for filename, count in movie_dialogues_cache.items():
        if title_lower in filename:
            return count
    return 0

# Update manifest
for cat_name, cat_data in manifest.items():
    if "movieList" not in cat_data: continue
    
    for item in cat_data["movieList"]:
        # Solo actualizar peliculas del 2023 (o las que esten en la cache)
        count = find_movie_dialogue_count(item["title"])
        if count > 0:
            item["dialogues"] = count

with open(manifest_path, 'w', encoding='utf-8') as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)

print("Dialogues successfully parsed for 2023 and added to manifest!")
