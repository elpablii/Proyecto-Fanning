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
# Skip series for now: Pan Am, Maid, All Her Fault, The Perfect Couple, The Girl From Plainville, The Big Bang Theory, Zootopia+
series_titles = ["Pan Am", "Maid", "All Her Fault", "The Perfect Couple", "The Girl From Plainville", "The Big Bang Theory", "Zootopia+", "Kim Possible", "Obi-Wan Kenobi"]

for item in manifest["2026"]["movieList"]:
    if item["title"] in series_titles:
        continue
        
    if item.get("dialogues", 0) == 0:
        movies_to_process.append(item)
        if len(movies_to_process) >= 15:
            break

if not movies_to_process:
    print("No more movies to process in 2026!")
    exit(0)

print("Processing the following 15 movies:")
for m in movies_to_process:
    print(f"- {m['title']}")

overrides = {
    "maleficent i": "maleficent",
    "maleficent ii mistress of evil": "mistress of evil",
    "zootopia i": "zootopia",
    "cars iii": "cars 3",
    "minions i": "minions",
    "tall girl i": "tall girl",
    "toy story iv": "toy story 4",
    "taylor swift - the eras tour film the final show": "taylor swift - the eras tour film",
    "orgullo y prejuicio": "pride and prejudice",
    "an american girl - grace stirs up success": "an american success - girl stirs up success",
    "la bella durmiente": "sleeping beauty",
    "cenicienta": "cinderella"
}

movie_pdfs = glob.glob(os.path.join(r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\Di*logos", "Di*logos pelis 2026", "*.pdf"))
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
d26 = {e["title"]: e.get("dialogues", 0) for e in manifest["2026"]["movieList"]}
for e in manifest["all"]["movieList"]:
    if e["title"] in d26 and d26[e["title"]] > 0:
        e["dialogues"] = d26[e["title"]]
        if "episodes" in e and len(e["episodes"]) > 0:
            e["episodes"][0]["dialogues"] = d26[e["title"]]

# Update yearlyData for 2026
for yd in manifest["yearlyData"]:
    if yd["year"] == "2026":
        yd["dialogues"] = sum(e.get("dialogues", 0) for e in manifest["2026"]["movieList"])

with open(manifest_path, 'w', encoding='utf-8') as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)

print("Batch successfully parsed and added to manifest!")
