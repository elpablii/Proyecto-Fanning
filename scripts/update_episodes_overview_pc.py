import json
import urllib.request
import urllib.parse

json_path = 'fanning-dashboard/public/data/pelis/The Perfect Couple.json'

with open(json_path, 'r', encoding='utf-8') as f:
    d = json.load(f)

# TMDB info fetching
api_key = 'd1765b8dccaf994068c4055e49e80566'
query = 'The Perfect Couple'
url = f'https://api.themoviedb.org/3/search/multi?api_key={api_key}&query={urllib.parse.quote(query)}&language=es-MX'

try:
    req = urllib.request.urlopen(url)
    data = json.loads(req.read())
    
    if data['results']:
        item = data['results'][0]
        tv_id = item['id']
        
        tv_url = f"https://api.themoviedb.org/3/tv/{tv_id}?api_key={api_key}&language=es-MX&append_to_response=season/1"
        req2 = urllib.request.urlopen(tv_url)
        tv_data = json.loads(req2.read())
        
        if 'season/1' in tv_data and 'episodes' in tv_data['season/1']:
            for ep in tv_data['season/1']['episodes']:
                ep_num = str(ep['episode_number'])
                overview = ep.get('overview', '')
                
                if 'tmdb' not in d: d['tmdb'] = {}
                if 'episodes' not in d['tmdb']: d['tmdb']['episodes'] = {}
                if ep_num not in d['tmdb']['episodes']: d['tmdb']['episodes'][ep_num] = {}
                
                d['tmdb']['episodes'][ep_num]['overview'] = overview
                d['tmdb']['episodes'][ep_num]['name'] = ep.get('name', '')
                if ep.get('still_path'):
                    d['tmdb']['episodes'][ep_num]['still_path'] = f"https://image.tmdb.org/t/p/w500{ep['still_path']}"

except Exception as e:
    print("Error fetching TMDB:", e)

# Add level and englishAnalysis
if 'episodes' in d:
    for ep in d['episodes']:
        vocab = ep.get('vocabulary', [])
        count = ep.get('count', 0)
        
        # Simple heuristic for CEFR level (MCER)
        # B2 as baseline, if it has a lot of words, maybe C1
        if count > 45:
            level = "C1"
        elif count < 30:
            level = "B1"
        else:
            level = "B2"
            
        ep['level'] = level
        
        words_sample = [v['word'] for v in vocab[:3]] if vocab else []
        words_str = ", ".join(f'"{w}"' for w in words_sample)
        
        analysis = f"Este episodio clasificado en el nivel MCER {level} contiene {count} términos clave. Presta atención a palabras como {words_str}, muy comunes en contextos de drama e investigaciones."
        ep['englishAnalysis'] = analysis

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(d, f, ensure_ascii=False, indent=2)

print("Saved The Perfect Couple with TMDB, Analysis and CEFR Levels.")
