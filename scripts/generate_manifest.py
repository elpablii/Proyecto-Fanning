import json
import os
import glob
import re
from collections import defaultdict

data_dir = r'c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data'

def clean_movie_title(raw_title):
    title = raw_title
    title = re.sub(r'\(lista.*?\)', '', title, flags=re.IGNORECASE)
    title = re.sub(r'\(S\d+EP.*?\)', '', title, flags=re.IGNORECASE)
    title = re.sub(r'\(Season.*?\)', '', title, flags=re.IGNORECASE)
    title = re.sub(r'parte \d', '', title, flags=re.IGNORECASE)
    if re.match(r'^Cars I$', title.strip(), re.IGNORECASE): title = "Cars"
    if re.match(r'^Cars II$', title.strip(), re.IGNORECASE): title = "Cars 2"
    return title.strip()

all_items = []
for fpath in glob.glob(os.path.join(data_dir, '*', '*.json')):
    with open(fpath, 'r', encoding='utf-8') as f:
        try:
            items = json.load(f)
            all_items.extend(items)
        except Exception as e:
            print(f"Error loading {fpath}: {e}")

manifest = {
    "all": {},
    "2023": {},
    "2024": {},
    "2025": {},
    "yearlyData": []
}

year_counts = defaultdict(int)
for item in all_items:
    year = str(item.get('year_processed', 'Unknown'))
    year_counts[year] += 1

manifest["yearlyData"] = [{"year": y, "words": c} for y, c in sorted(year_counts.items()) if y in ["2023", "2024", "2025"]]

def process_stats(items):
    total_words = len(items)
    
    movies_map = {}
    for v in items:
        clean_title = clean_movie_title(v.get('source_movie', ''))
        if "unknown words" in clean_title.lower() or not clean_title:
            continue
        
        if clean_title not in movies_map:
            movies_map[clean_title] = {"count": 0, "episodes": defaultdict(int)}
            
        movies_map[clean_title]["count"] += 1
        ep_name = v.get('source_movie', '')
        movies_map[clean_title]["episodes"][ep_name] += 1
        
    unique_movies = len(movies_map)
    movie_list = []
    for title, data in movies_map.items():
        episodes = [{"name": name, "count": count} for name, count in sorted(data["episodes"].items(), key=lambda x: x[1], reverse=True)]
        movie_list.append({
            "title": title,
            "count": data["count"],
            "episodes": episodes
        })
    movie_list.sort(key=lambda x: x["count"], reverse=True)
    
    word_map = {}
    for item in items:
        w = item.get('word', '').lower()
        freq = item.get('global_frequency', 0)
        if w not in word_map or freq > word_map[w]['count']:
            word_map[w] = {
                "word": item.get('word', ''),
                "count": freq,
                "translation": item.get('translation', '')
            }
            
    top_list = sorted(list(word_map.values()), key=lambda x: x["count"], reverse=True)[:10]
    top_word = top_list[0] if top_list else {"word": "N/A", "count": 0, "translation": ""}
    
    return {
        "totalWords": total_words,
        "uniqueMovies": unique_movies,
        "topWord": top_word,
        "topList": top_list,
        "movieList": movie_list
    }

manifest["all"] = process_stats(all_items)
for year in ["2023", "2024", "2025"]:
    year_items = [i for i in all_items if str(i.get('year_processed', '')) == year]
    manifest[year] = process_stats(year_items)

out_file = os.path.join(data_dir, 'manifest.json')
with open(out_file, 'w', encoding='utf-8') as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)

print(f"Manifest created at {out_file} with {len(all_items)} total items processed.")
