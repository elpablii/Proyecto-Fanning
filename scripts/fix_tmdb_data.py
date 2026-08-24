import json
import urllib.request
import urllib.parse
import os

api_key = 'd1765b8dccaf994068c4055e49e80566'

series_to_fix = [
    "Gambito de Dama"
]

def get_tmdb_data(title, language="es-MX"):
    url = f'https://api.themoviedb.org/3/search/multi?api_key={api_key}&query={urllib.parse.quote(title)}&language={language}'
    req = urllib.request.urlopen(url)
    return json.loads(req.read())

def get_tv_season(tv_id, language="es-MX"):
    url = f"https://api.themoviedb.org/3/tv/{tv_id}?api_key={api_key}&language={language}&append_to_response=season/1"
    req = urllib.request.urlopen(url)
    return json.loads(req.read())

for title in series_to_fix:
    json_path = f'fanning-dashboard/public/data/pelis/{title}.json'
    if not os.path.exists(json_path):
        continue
        
    with open(json_path, 'r', encoding='utf-8') as f:
        d = json.load(f)
        
    if 'tmdb' not in d: d['tmdb'] = {}
    if 'episodes' not in d['tmdb']: d['tmdb']['episodes'] = {}
    
    if title == "Gambito de Dama":
        tv_id = 87739
        item_es = get_tv_season(tv_id, "es-MX")
        item_en = get_tv_season(tv_id, "en-US")
    elif title == "Pan Am":
        es_data = get_tmdb_data(title, "es-MX")
        en_data = get_tmdb_data(title, "en-US")
        
        if es_data['results'] and en_data['results']:
            item_es = es_data['results'][0]
            item_en = en_data['results'][0]
            tv_id = item_es['id']
        else:
            continue
            
    # Set general overview (fallback to English if Spanish is empty)
    overview = item_es.get('overview') or item_en.get('overview', '')
    d['tmdb']['overview'] = overview
    
    # 2. Fetch Season data
    tv_es = get_tv_season(tv_id, "es-MX")
    tv_en = get_tv_season(tv_id, "en-US")
    
    if 'season/1' in tv_en and 'episodes' in tv_en['season/1']:
        eps_es = {str(ep['episode_number']): ep for ep in tv_es.get('season/1', {}).get('episodes', [])}
        eps_en = {str(ep['episode_number']): ep for ep in tv_en.get('season/1', {}).get('episodes', [])}
        
        for ep_idx, ep_data in enumerate(d.get('episodes', [])):
            ep_num = str(ep_idx + 1)
            if ep_idx == 7 and title == "Gambito de Dama":
                # Special episode hardcode
                d['tmdb']['episodes'][ep_num] = {
                    'overview': 'Una mirada detrás de escena a la creación de Gambito de Dama.',
                    'name': 'Creating Queen\'s Gambit',
                    'still_path': 'https://image.tmdb.org/t/p/w500/u3bZgnGQ9T01sWNhyveQz0wH0Hl.jpg' # use show backdrop
                }
                continue
                
            en_info = eps_en.get(ep_num, {})
            es_info = eps_es.get(ep_num, {})
            
            # Get overview: Try Spanish first, fallback to English
            ep_overview = es_info.get('overview') or en_info.get('overview', '')
            
            # Get Original Title (English)
            ep_name = en_info.get('name', f"Episode {ep_num}")
            
            if ep_num not in d['tmdb']['episodes']:
                d['tmdb']['episodes'][ep_num] = {}
                
            d['tmdb']['episodes'][ep_num]['overview'] = ep_overview
            d['tmdb']['episodes'][ep_num]['name'] = ep_name
            
            if en_info.get('still_path'):
                d['tmdb']['episodes'][ep_num]['still_path'] = f"https://image.tmdb.org/t/p/w500{en_info['still_path']}"

    # 3. Ensure CEFR level is assigned
    if 'episodes' in d:
        for ep in d['episodes']:
            count = ep.get('count', 0)
            if 'level' not in ep:
                if count > 45: level = "C1"
                elif count < 30: level = "B1"
                else: level = "B2"
                ep['level'] = level

    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(d, f, ensure_ascii=False, indent=2)
    
    print(f"Fixed {title}: General Overview, Episode Overviews (w/ fallback), Original Titles, CEFR Levels.")
