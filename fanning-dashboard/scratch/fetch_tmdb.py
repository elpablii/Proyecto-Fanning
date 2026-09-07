import urllib.request
import json
import os

API_KEY = "d1765b8dccaf994068c4055e49e80566"
TMDB_ID = 2345 # Kim Possible

data = {}

def get_json(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read())
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return None

# General show info
show_url = f"https://api.themoviedb.org/3/tv/{TMDB_ID}?api_key={API_KEY}&language=es-MX"
show_info = get_json(show_url)
if show_info:
    data["overview"] = show_info.get("overview")
    print(f"Overview: {data['overview'][:50]}...")

# Seasons
data["seasons"] = {}
for season_num in range(1, 5):
    season_url = f"https://api.themoviedb.org/3/tv/{TMDB_ID}/season/{season_num}?api_key={API_KEY}&language=es-MX"
    season_info = get_json(season_url)
    if season_info and "episodes" in season_info:
        data["seasons"][season_num] = season_info["episodes"]
        print(f"Season {season_num} episodes: {len(data['seasons'][season_num])}")

# Specials (Season 0)
season0_url = f"https://api.themoviedb.org/3/tv/{TMDB_ID}/season/0?api_key={API_KEY}&language=es-MX"
season0_info = get_json(season0_url)
if season0_info and "episodes" in season0_info:
    data["seasons"][0] = season0_info["episodes"]
    print(f"Season 0 (Specials) episodes: {len(data['seasons'][0])}")

os.makedirs("scratch", exist_ok=True)
with open("scratch/tmdb_kim.json", "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("TMDB Data fetched.")
