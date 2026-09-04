import json
import os
import glob
import re
from collections import defaultdict

data_dir = r'c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data'
out_file = os.path.join(data_dir, 'manifest.json')

def clean_movie_title(raw_title):
    title = raw_title
    title = re.sub(r'\(lista.*?\)', '', title, flags=re.IGNORECASE)
    title = re.sub(r'\(S\d+EP.*?\)', '', title, flags=re.IGNORECASE)
    title = re.sub(r'\(S\d+E.*?\)', '', title, flags=re.IGNORECASE)
    title = re.sub(r'\(Season.*?\)', '', title, flags=re.IGNORECASE)
    title = re.sub(r'\(Episodes?.*?\)', '', title, flags=re.IGNORECASE)
    title = re.sub(r'\(Part.*?\)', '', title, flags=re.IGNORECASE)
    title = re.sub(r'\(Special.*?\)', '', title, flags=re.IGNORECASE)
    title = re.sub(r'parte \d', '', title, flags=re.IGNORECASE)
    if re.match(r'^Cars I$', title.strip(), re.IGNORECASE): title = "Cars"
    if re.match(r'^Cars II$', title.strip(), re.IGNORECASE): title = "Cars 2"
    return title.strip()

all_items = []
for fpath in glob.glob(os.path.join(data_dir, '*', '*.json')):
    with open(fpath, 'r', encoding='utf-8') as f:
        try:
            items = json.load(f)
            if isinstance(items, list):
                all_items.extend(items)
        except Exception as e:
            print(f"Error loading {fpath}: {e}")

manifest = {
    "all": {},
    "2023": {},
    "2024": {},
    "2025": {},
    "2026": {},
    "2027": {},
    "yearlyData": []
}

year_counts = defaultdict(int)
for item in all_items:
    year = str(item.get('year_processed', 'Unknown'))
    year_counts[year] += 1

yearly_data = []
old_m = {}
if os.path.exists(out_file):
    try:
        with open(out_file, 'r', encoding='utf-8') as f:
            old_m = json.load(f)
    except: pass

old_yearly = {yd['year']: yd.get('dialogues', 0) for yd in old_m.get('yearlyData', [])}

for y in ["2023", "2024", "2025", "2026", "2027"]:
    if y in year_counts:
        yearly_data.append({
            "year": y, 
            "words": year_counts[y],
            "dialogues": old_yearly.get(y, 0)
        })
manifest["yearlyData"] = yearly_data

old_movie_dialogues = {}
old_movie_posters = {}
old_movie_backdrops = {}
old_movie_levels = {}
old_movie_ratings = {}
for y_key in old_m:
    if y_key in ["all", "2023", "2024", "2025", "2026", "2027"] and isinstance(old_m[y_key], dict):
        for movie in old_m[y_key].get("movieList", []):
            if movie.get("dialogues"):
                old_movie_dialogues[movie["title"]] = movie["dialogues"]
            if movie.get("posterUrl"):
                old_movie_posters[movie["title"]] = movie["posterUrl"]
            if movie.get("backdropUrl"):
                old_movie_backdrops[movie["title"]] = movie["backdropUrl"]
            if movie.get("level"):
                old_movie_levels[movie["title"]] = movie["level"]
            if movie.get("rating"):
                old_movie_ratings[movie["title"]] = movie["rating"]
            for ep in movie.get("episodes", []):
                if ep.get("dialogues"):
                    old_movie_dialogues[f"{movie['title']}__{ep['name']}"] = ep["dialogues"]
                if ep.get("level"):
                    old_movie_levels[f"{movie['title']}__{ep['name']}"] = ep["level"]

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
        episodes = []
        
        def get_ep_num(name):
            season_weight = 0
            m_s = re.search(r'S(\d+)E', name, re.IGNORECASE)
            if m_s: season_weight = int(m_s.group(1)) * 1000
            
            m = re.search(r'(?:EP|Episode)\s*#?(\d+)', name, re.IGNORECASE)
            if m: return season_weight + int(m.group(1))
            m2 = re.search(r'E(\d+)', name, re.IGNORECASE)
            if m2: return season_weight + int(m2.group(1))
            m_special = re.search(r'Special\s+(\d+)', name, re.IGNORECASE)
            if m_special: return 1500 + int(m_special.group(1))
            
            roman_m = re.search(r'Part\s+([IVXLCDM]+)', name, re.IGNORECASE)
            if roman_m:
                roman = roman_m.group(1).upper()
                roman_to_int = {'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6}
                return roman_to_int.get(roman, 9999)
            return 9999

        sorted_episodes = sorted(data["episodes"].items(), key=lambda x: get_ep_num(x[0]))
        
        for name, count in sorted_episodes:
            ep_dict = {"name": name, "count": count}
            ep_d_key = f"{title}__{name}"
            if ep_d_key in old_movie_dialogues:
                ep_dict["dialogues"] = old_movie_dialogues[ep_d_key]
                
            # Prefer the level from the JSON file itself if present
            # The 'count' here is just the unknown words count. We should check if the JSON file for this movie exists and has a level for this episode.
            ep_level = None
            movie_json_path = os.path.join(data_dir, 'pelis', f'{title}.json')
            if os.path.exists(movie_json_path):
                try:
                    with open(movie_json_path, 'r', encoding='utf-8') as f_movie:
                        movie_data = json.load(f_movie)
                        if "episodes" in movie_data and isinstance(movie_data["episodes"], list):
                            for orig_ep in movie_data["episodes"]:
                                if orig_ep.get("name") == name and "level" in orig_ep:
                                    ep_level = orig_ep["level"]
                                    break
                except: pass
            
            ep_dict["level"] = ep_level or old_movie_levels.get(ep_d_key, "B2")
            episodes.append(ep_dict)
            
        is_series = False
        special_series = ['kim possible', 'the big bang theory', 'euphoria', 'gambito de dama', 'maid', 'pan am', 'all her fault', 'the perfect couple', 'the girl from plainville', 'dream productions', 'obi-wan kenobi']
        if title.lower() in special_series:
            is_series = True
        elif len(episodes) > 1 and any("ep" in ep["name"].lower() for ep in episodes):
            is_series = True
            
        movie_level = None
        movie_rating = None
        movie_json_path = os.path.join(data_dir, 'pelis', f'{title}.json')
        if os.path.exists(movie_json_path):
            try:
                with open(movie_json_path, 'r', encoding='utf-8') as f_movie:
                    movie_data = json.load(f_movie)
                    if "level" in movie_data:
                        movie_level = movie_data["level"]
                    if "tmdb" in movie_data and "rating" in movie_data["tmdb"]:
                        movie_rating = movie_data["tmdb"]["rating"]
            except: pass

        m_dict = {
            "title": title,
            "count": data["count"],
            "type": "series" if is_series else "movie",
            "episodes": episodes,
            "level": movie_level or old_movie_levels.get(title, "B2"),
            "rating": movie_rating or old_movie_ratings.get(title, "TE")
        }
        if title in old_movie_dialogues:
            m_dict["dialogues"] = old_movie_dialogues[title]
        if title in old_movie_posters:
            m_dict["posterUrl"] = old_movie_posters[title]
        if title in old_movie_backdrops:
            m_dict["backdropUrl"] = old_movie_backdrops[title]
            
        if title == "Obi-Wan Kenobi":
            m_dict["posterUrl"] = "https://image.tmdb.org/t/p/w500/qJRB789ceLryrLvOKrZqLKr2CGf.jpg"
            m_dict["backdropUrl"] = "https://image.tmdb.org/t/p/original/p3Jmm6d1ShUrJEuU3DYD2K19c66.jpg"
            
        if title == "Euphoria":
            m_dict["posterUrl"] = "https://image.tmdb.org/t/p/w500/6Sdm5XwdCnspdEF8fTFx6UJrl7o.jpg"
            m_dict["backdropUrl"] = "https://image.tmdb.org/t/p/original/mez2Z3WqlPKNXpi7mWoiiE5guE9.jpg"
            
        movie_list.append(m_dict)
        
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
for year in ["2023", "2024", "2025", "2026", "2027"]:
    year_items = [i for i in all_items if str(i.get('year_processed', '')) == year]
    manifest[year] = process_stats(year_items)

with open(out_file, 'w', encoding='utf-8') as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)

print(f"Manifest created at {out_file} with {len(all_items)} total items processed.")
