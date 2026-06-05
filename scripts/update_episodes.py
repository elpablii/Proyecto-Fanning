import os
import pypdf
import json
import re

vocab_dir = r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\Vocabularios"
manifest_path = r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data\manifest.json"

series_names = ["Kim Possible", "The Big Bang Theory", "Euphoria", "Gambito de Dama"]

# Store episode counts globally and per year
# Format: { "Series Name": { "Year": [ {"name": "EP1", "count": 10} ] } }
episodes_by_series = { s: {"2024": [], "2025": [], "all": []} for s in series_names }

def clean_episode_name(filename, series_name):
    name = filename.replace('.pdf', '')
    name = name.replace('Palabras desconocidas de', '').strip()
    name = name.replace(series_name, '').strip()
    name = name.replace('(lista definitiva)', '').strip()
    name = name.strip('() ')
    if not name:
        name = "Película/Especial"
    return name

for root, dirs, files in os.walk(vocab_dir):
    for f in files:
        if f.lower().endswith('.pdf'):
            path = os.path.join(root, f)
            
            # Determine year
            year = "all"
            if "2024" in path: year = "2024"
            elif "2025" in path: year = "2025"
            
            # Determine series
            matched_series = None
            for s in series_names:
                if s.lower() in f.lower():
                    matched_series = s
                    break
            
            if not matched_series:
                continue
                
            # Parse PDF
            word_count = 0
            try:
                reader = pypdf.PdfReader(path)
                for page in reader.pages:
                    text = page.extract_text()
                    if not text: continue
                    lines = text.split('\n')
                    for line in lines:
                        line = line.strip()
                        if not line: continue
                        if "unknown words from" in line.lower() or "words/phrases" in line.lower():
                            continue
                        # If it's a valid line, count it
                        word_count += 1
            except Exception as e:
                print(f"Error reading {path}: {e}")
                continue
                
            ep_name = clean_episode_name(f, matched_series)
            ep_obj = {"name": ep_name, "count": word_count}
            
            episodes_by_series[matched_series][year].append(ep_obj)
            episodes_by_series[matched_series]["all"].append(ep_obj)

# Sort episodes alphabetically or logically
import functools

def sort_episodes(ep1, ep2):
    return (ep1['name'] > ep2['name']) - (ep1['name'] < ep2['name'])

for s in series_names:
    for cat in ["all", "2024", "2025"]:
        episodes_by_series[s][cat].sort(key=lambda x: x['name'])

# Update Manifest
with open(manifest_path, 'r', encoding='utf-8') as f:
    manifest = json.load(f)

for category in ["all", "2024", "2025"]:
    if category not in manifest: continue
    movie_list = manifest[category].get("movieList", [])
    for movie in movie_list:
        title = movie["title"]
        if title in series_names:
            # Reemplazar con el desglose si hay datos
            if episodes_by_series[title][category]:
                movie["episodes"] = episodes_by_series[title][category]
                # Update total count to be the sum of parsed episodes just in case
                movie["count"] = sum(e["count"] for e in movie["episodes"])
                print(f"Updated {title} in {category} with {len(movie['episodes'])} episodes.")

with open(manifest_path, 'w', encoding='utf-8') as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)

print("Manifest successfully updated with episode breakdowns!")
