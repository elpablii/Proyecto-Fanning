import json
import urllib.request
import urllib.parse
import os

json_path = 'fanning-dashboard/public/data/pelis/The Girl From Plainville.json'

with open(json_path, 'r', encoding='utf-8') as f:
    d = json.load(f)

api_key = 'd1765b8dccaf994068c4055e49e80566'
query = 'The Girl From Plainville'
url = f'https://api.themoviedb.org/3/search/multi?api_key={api_key}&query={urllib.parse.quote(query)}&language=es-MX'

try:
    req = urllib.request.urlopen(url)
    data = json.loads(req.read())
    
    if data['results']:
        item = data['results'][0]
        tv_id = item['id']
        
        # Fetch season 1
        tv_url = f"https://api.themoviedb.org/3/tv/{tv_id}?api_key={api_key}&language=es-MX&append_to_response=season/1"
        req2 = urllib.request.urlopen(tv_url)
        tv_data = json.loads(req2.read())
        
        if 'season/1' in tv_data and 'episodes' in tv_data['season/1']:
            for ep in tv_data['season/1']['episodes']:
                ep_num = str(ep['episode_number'])
                overview = ep.get('overview', '')
                
                # Update tmdb dictionary
                if 'tmdb' not in d: d['tmdb'] = {}
                if 'episodes' not in d['tmdb']: d['tmdb']['episodes'] = {}
                if ep_num not in d['tmdb']['episodes']: d['tmdb']['episodes'][ep_num] = {}
                
                d['tmdb']['episodes'][ep_num]['overview'] = overview
                print(f"Updated TMDB overview for Episode {ep_num}")

except Exception as e:
    print("Error fetching from TMDB:", e)

# Add English Analysis based on vocab
if 'episodes' in d:
    for ep in d['episodes']:
        vocab = ep.get('vocabulary', [])
        count = ep.get('count', 0)
        
        # Pick 3 random or top words
        words_sample = [v['word'] for v in vocab[:3]] if vocab else []
        words_str = ", ".join(f'"{w}"' for w in words_sample)
        
        analysis = f"Este episodio introduce {count} palabras y frases clave para comprender los diálogos. Entre ellas destacan expresiones como {words_str}, las cuales son fundamentales para captar el contexto emocional y judicial de la trama."
        
        ep['englishAnalysis'] = analysis

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(d, f, ensure_ascii=False, indent=2)

print("Saved JSON with episode overviews and english analysis.")
