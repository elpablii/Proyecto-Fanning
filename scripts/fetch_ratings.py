import json
import urllib.request
import urllib.parse
import os
import glob
import time

api_key = 'd1765b8dccaf994068c4055e49e80566'

def map_rating_to_chile(us_rating):
    if not us_rating:
        return "TE"
        
    ur = us_rating.upper().strip()
    
    if ur in ["G", "TV-Y", "TV-Y7", "TV-Y7-FV", "TV-G"]:
        return "TE"
    elif ur in ["PG", "TV-PG"]:
        return "TE+7"
    elif ur in ["PG-13", "TV-14"]:
        return "+14"
    elif ur in ["R", "NC-17", "TV-MA", "M", "AO"]:
        return "+18"
    else:
        return "TE"  # Fallback

def get_tmdb_search(title):
    # Hardcoded GTA VI override
    if "Grand Theft Auto VI" in title:
        return {"media_type": "game", "rating": "M", "id": 0} 

    # Using the same mapping from tmdb.ts to avoid mismatches
    mapping = {
        "Taylor Swift - The Eras Tour Film The Final Show": "Taylor Swift The Eras Tour",
        "Kim Possible Todo un Drama": "Kim Possible: So the Drama",
        "Los Fantasmas de Scrooge": "A Christmas Carol",
        "Riesgo Bajo Cero": "The Ice Road",
        "Intensamente": "Inside Out",
        "Intensamente 2": "Inside Out 2",
        "Venganza Implacable": "Honest Thief"
    }
    search_title = mapping.get(title, title)
    
    url = f'https://api.themoviedb.org/3/search/multi?api_key={api_key}&query={urllib.parse.quote(search_title)}'
    try:
        req = urllib.request.urlopen(url)
        data = json.loads(req.read())
        if data['results']:
            # Prefer matching type, or just return first
            for res in data['results']:
                if res.get('media_type') in ['movie', 'tv']:
                    return res
            return data['results'][0]
    except Exception as e:
        print(f"Error searching {title}: {e}")
    return None

def get_movie_certification(movie_id):
    url = f"https://api.themoviedb.org/3/movie/{movie_id}/release_dates?api_key={api_key}"
    try:
        req = urllib.request.urlopen(url)
        data = json.loads(req.read())
        # Try US first
        for res in data.get('results', []):
            if res['iso_3166_1'] == 'US':
                for release in res.get('release_dates', []):
                    if release.get('certification'):
                        return release['certification']
        # Fallback to any certification
        for res in data.get('results', []):
            for release in res.get('release_dates', []):
                if release.get('certification'):
                    return release['certification']
    except Exception as e:
        pass
    return None

def get_tv_certification(tv_id):
    url = f"https://api.themoviedb.org/3/tv/{tv_id}/content_ratings?api_key={api_key}"
    try:
        req = urllib.request.urlopen(url)
        data = json.loads(req.read())
        for res in data.get('results', []):
            if res['iso_3166_1'] == 'US':
                return res.get('rating')
        if data.get('results'):
            return data['results'][0].get('rating')
    except Exception as e:
        pass
    return None

# Also handle explicit series mappings:
tv_overrides = {
    "Gambito de Dama": 87739,
    "Pan Am": 39259,
    "Dream Productions": 255868,
    "Obi-Wan Kenobi": 92830,
    "Euphoria": 85552
}

files = glob.glob(r'C:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data\pelis\*.json')
for fpath in files:
    with open(fpath, 'r', encoding='utf-8') as f:
        try:
            d = json.load(f)
        except:
            continue
            
    title = d.get('title')
    if not title: continue
    
    # Check if already has rating
    if d.get('tmdb') and d['tmdb'].get('rating'):
        continue
        
    print(f"Processing {title}...")
    
    us_rating = None
    
    if title in tv_overrides:
        us_rating = get_tv_certification(tv_overrides[title])
    else:
        search_res = get_tmdb_search(title)
        if search_res:
            media_type = search_res.get('media_type')
            if media_type == 'game':
                us_rating = search_res.get('rating')
            elif media_type == 'movie':
                us_rating = get_movie_certification(search_res['id'])
            elif media_type == 'tv':
                us_rating = get_tv_certification(search_res['id'])
            
    chile_rating = map_rating_to_chile(us_rating)
    print(f"  -> US: {us_rating} | Chile: {chile_rating}")
    
    if 'tmdb' not in d:
        d['tmdb'] = {}
    d['tmdb']['rating'] = chile_rating
    
    with open(fpath, 'w', encoding='utf-8') as f:
        json.dump(d, f, ensure_ascii=False, indent=2)
        
    time.sleep(0.1) # Be nice to TMDB API

print("Done fetching ratings!")
