import urllib.request
import json
import os

api_key = 'd1765b8dccaf994068c4055e49e80566'

def get_tv_season(tv_id, season_number, language="es-MX"):
    try:
        url = f'https://api.themoviedb.org/3/tv/{tv_id}/season/{season_number}?api_key={api_key}&language={language}'
        req = urllib.request.urlopen(url)
        return json.loads(req.read())
    except:
        return None

def get_tv_episode(tv_id, season_number, episode_number, language="es-MX"):
    try:
        url = f'https://api.themoviedb.org/3/tv/{tv_id}/season/{season_number}/episode/{episode_number}?api_key={api_key}&language={language}'
        req = urllib.request.urlopen(url)
        return json.loads(req.read())
    except:
        return None

json_path = r'c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data\pelis\Euphoria.json'
with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

tv_id = 85552

if 'tmdb' not in data:
    data['tmdb'] = {'episodes': {}}

# Fetch general overview
url_main = f'https://api.themoviedb.org/3/tv/{tv_id}?api_key={api_key}&language=es-MX'
try:
    req = urllib.request.urlopen(url_main)
    main_data = json.loads(req.read())
    if 'overview' not in data or not data['overview']:
        data['overview'] = main_data.get('overview', '')
except: pass

print("Fetching Euphoria TMDB metadata...")

for ep_idx, ep in enumerate(data.get('episodes', [])):
    ep_name = ep['name']
    
    # Determine season and episode for TMDB
    season_num = 1
    ep_num = 1
    
    import re
    if "S01E" in ep_name:
        season_num = 1
        ep_num = int(re.search(r'E(\d+)', ep_name).group(1))
    elif "S02E" in ep_name:
        season_num = 2
        ep_num = int(re.search(r'E(\d+)', ep_name).group(1))
    elif "Special" in ep_name:
        season_num = 0
        ep_num = int(re.search(r'Special (\d+)', ep_name).group(1))

    es_info = get_tv_episode(tv_id, season_num, ep_num, "es-MX") or {}
    en_info = get_tv_episode(tv_id, season_num, ep_num, "en-US") or {}

    ep_overview = es_info.get('overview') or en_info.get('overview', '')
    original_name = en_info.get('name', ep_name)
    still_path = es_info.get('still_path') or en_info.get('still_path')
    if still_path:
        still_path = f"https://image.tmdb.org/t/p/w500{still_path}"
        
    ep_id = str(ep_idx + 1)
    if ep_id not in data['tmdb']['episodes']:
        data['tmdb']['episodes'][ep_id] = {}
        
    data['tmdb']['episodes'][ep_id]['overview'] = ep_overview
    data['tmdb']['episodes'][ep_id]['name'] = original_name
    if still_path:
        data['tmdb']['episodes'][ep_id]['still_path'] = still_path
        
    print(f"Mapped {ep_name} -> S{season_num}E{ep_num} ({original_name})")

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("TMDB Euphoria update complete!")
