import json
import os
import glob
import re
from collections import defaultdict

data_dir = r'c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data'
dialogos_dir = r'c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\Diálogos'
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


def count_dialogues_in_pdf(pdf_path):
    try:
        import fitz
        doc = fitz.open(pdf_path)
        text = ''
        for page in doc:
            text += page.get_text()
        blocks = re.split(r'\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}', text)
        count = 0
        for block in blocks[1:]:
            block_lines = block.strip().split('\n')
            valid_text = ' '.join([l for l in block_lines if not re.match(r'^\s*\d+\s*$', l)])
            if re.search(r'[a-zA-ZáéíóúÁÉÍÓÚñÑ]', valid_text):
                count += 1
        return count
    except Exception as e:
        print(f"  [WARN] Could not read PDF {os.path.basename(pdf_path)}: {e}")
        return 0


def extract_movie_name_from_pdf_filename(filename):
    name = os.path.splitext(filename)[0]
    name = re.sub(
        r'^(Dialogues? from |Guión? de la pel[ií]cula |Guion de la pel[ií]cula )',
        '', name, flags=re.IGNORECASE
    ).strip()
    name = re.sub(
        r'\s*(to improve (the )?vocabulary.*|in English.*|para aumentar el vocabulario.*)$',
        '', name, flags=re.IGNORECASE
    ).strip()
    return name


print("Scanning dialogue PDFs...")

dialogue_map = {}
year_dialogue_counts = defaultdict(int)

for root, dirs, files in os.walk(dialogos_dir):
    folder = os.path.basename(root)
    year_match = re.search(r'(202\d)', folder)
    year = year_match.group(1) if year_match else 'series'

    for fname in files:
        if not fname.lower().endswith('.pdf'):
            continue
        pdf_path = os.path.join(root, fname)
        raw_name = extract_movie_name_from_pdf_filename(fname)
        lower = raw_name.lower().strip()

        print(f"  Counting '{raw_name}' ({year})...")
        count = count_dialogues_in_pdf(pdf_path)

        if lower not in dialogue_map:
            dialogue_map[lower] = 0
        dialogue_map[lower] += count

        if year.isdigit():
            year_dialogue_counts[year] += count

print(f"Done. {len(dialogue_map)} unique titles with dialogues counted.")


print("Loading vocabulary JSON files...")
all_items = []
for fpath in glob.glob(os.path.join(data_dir, '*', '*.json')):
    with open(fpath, 'r', encoding='utf-8') as f:
        try:
            items = json.load(f)
            if isinstance(items, list):
                all_items.extend(items)
        except Exception as e:
            print(f"Error loading {fpath}: {e}")

print(f"Loaded {len(all_items)} vocabulary items.")


old_m = {}
if os.path.exists(out_file):
    try:
        with open(out_file, 'r', encoding='utf-8') as f:
            old_m = json.load(f)
    except:
        pass

old_movie_posters = {}
old_movie_backdrops = {}
old_movie_levels = {}
old_movie_ratings = {}
for y_key in old_m:
    if y_key in ["all", "2023", "2024", "2025", "2026", "2027"] and isinstance(old_m[y_key], dict):
        for movie in old_m[y_key].get("movieList", []):
            if movie.get("posterUrl"):
                old_movie_posters[movie["title"]] = movie["posterUrl"]
            if movie.get("backdropUrl"):
                old_movie_backdrops[movie["title"]] = movie["backdropUrl"]
            if movie.get("level"):
                old_movie_levels[movie["title"]] = movie["level"]
            if movie.get("rating"):
                old_movie_ratings[movie["title"]] = movie["rating"]
            for ep in movie.get("episodes", []):
                ep_key = f"{movie['title']}__{ep['name']}"
                if ep.get("level"):
                    old_movie_levels[ep_key] = ep["level"]


def resolve_dialogues(title):
    t_lower = title.lower().strip()
    if t_lower in dialogue_map:
        return dialogue_map[t_lower]
    best = None
    best_len = 0
    for k, v in dialogue_map.items():
        if k in t_lower or t_lower in k:
            if len(k) > best_len:
                best = v
                best_len = len(k)
    return best


manifest = {
    "all": {},
    "2023": {},
    "2024": {},
    "2025": {},
    "2026": {},
    "2027": {},
    "yearlyData": []
}

year_word_counts = defaultdict(int)
for item in all_items:
    year = str(item.get('year_processed', 'Unknown'))
    year_word_counts[year] += 1

yearly_data = []
for y in ["2023", "2024", "2025", "2026", "2027"]:
    if y in year_word_counts:
        yearly_data.append({
            "year": y,
            "words": year_word_counts[y],
            "dialogues": year_dialogue_counts.get(y, 0)
        })
manifest["yearlyData"] = yearly_data


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
            if m_s:
                season_weight = int(m_s.group(1)) * 1000
            m = re.search(r'(?:EP|Episode)\s*#?(\d+)', name, re.IGNORECASE)
            if m:
                return season_weight + int(m.group(1))
            m2 = re.search(r'E(\d+)', name, re.IGNORECASE)
            if m2:
                return season_weight + int(m2.group(1))
            m_special = re.search(r'Special\s+(\d+)', name, re.IGNORECASE)
            if m_special:
                return 1500 + int(m_special.group(1))
            roman_m = re.search(r'Part\s+([IVXLCDM]+)', name, re.IGNORECASE)
            if roman_m:
                roman = roman_m.group(1).upper()
                roman_to_int = {'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6}
                return roman_to_int.get(roman, 9999)
            return 9999

        sorted_episodes = sorted(data["episodes"].items(), key=lambda x: get_ep_num(x[0]))

        for name, count in sorted_episodes:
            ep_dict = {"name": name, "count": count}
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
                except:
                    pass
            ep_dict["level"] = ep_level or old_movie_levels.get(f"{title}__{name}", "B2")
            episodes.append(ep_dict)

        is_series = False
        special_series = [
            'kim possible', 'the big bang theory', 'euphoria', 'gambito de dama',
            'maid', 'pan am', 'all her fault', 'the perfect couple',
            'the girl from plainville', 'dream productions', 'obi-wan kenobi'
        ]
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
                    # Override episodes if they exist in pelis json (fixes TBBT/Kim Possible merged episodes)
                    if "episodes" in movie_data and isinstance(movie_data["episodes"], list) and len(movie_data["episodes"]) > 0:
                        new_episodes = []
                        for orig_ep in movie_data["episodes"]:
                            ep_name = orig_ep.get("name")
                            ep_count = len(orig_ep.get("vocabulary", []))
                            ep_level = orig_ep.get("level") or old_movie_levels.get(f"{title}__{ep_name}", "B2")
                            new_episodes.append({"name": ep_name, "count": ep_count, "level": ep_level})
                        if new_episodes:
                            episodes = new_episodes
                            data["count"] = sum(e["count"] for e in new_episodes)
            except:
                pass

        fresh_dialogues = resolve_dialogues(title)
        final_dialogues = fresh_dialogues if fresh_dialogues is not None else 0
        
        # Filtrar películas que no tienen diálogos procesados (0 líneas)
        if final_dialogues == 0:
            continue

        m_dict = {
            "title": title,
            "count": data["count"],
            "type": "series" if is_series else "movie",
            "episodes": episodes,
            "level": movie_level or old_movie_levels.get(title, "B2"),
            "rating": movie_rating or old_movie_ratings.get(title, "TE"),
            "dialogues": final_dialogues
        }

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
    total_dialogues = sum(m.get("dialogues", 0) for m in movie_list)
    unique_movies = len(movie_list)

    return {
        "totalWords": total_words,
        "uniqueMovies": unique_movies,
        "totalDialogues": total_dialogues,
        "topWord": top_word,
        "topList": top_list,
        "movieList": movie_list
    }


print("Building manifest...")
manifest["all"] = process_stats(all_items)
for year in ["2023", "2024", "2025", "2026", "2027"]:
    year_items = [i for i in all_items if str(i.get('year_processed', '')) == year]
    manifest[year] = process_stats(year_items)

with open(out_file, 'w', encoding='utf-8') as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)

print(f"\nManifest created at {out_file}")
print(f"  Total vocabulary items : {len(all_items)}")
print(f"  Total dialogue lines   : {manifest['all']['totalDialogues']}")
print(f"  Unique titles          : {manifest['all']['uniqueMovies']}")
for yd in manifest["yearlyData"]:
    print(f"  {yd['year']}: {yd['words']} words, {yd['dialogues']} dialogue lines")
