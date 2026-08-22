import urllib.request
import json

api_key = 'd1765b8dccaf994068c4055e49e80566'
query = 'The Girl From Plainville'
url = f'https://api.themoviedb.org/3/search/multi?api_key={api_key}&query={urllib.parse.quote(query)}&language=es-MX'

req = urllib.request.urlopen(url)
data = json.loads(req.read())

if data['results']:
    item = data['results'][0]
    print(f"ID: {item['id']}, Type: {item['media_type']}")
    
    if item['media_type'] == 'tv':
        tv_url = f"https://api.themoviedb.org/3/tv/{item['id']}?api_key={api_key}&language=es-MX&append_to_response=images,season/1"
        req2 = urllib.request.urlopen(tv_url)
        tv_data = json.loads(req2.read())
        
        print(f"Seasons: {len(tv_data['seasons'])}")
        
        if 'season/1' in tv_data:
            episodes = tv_data['season/1']['episodes']
            for ep in episodes:
                print(f"Ep {ep['episode_number']}: {ep['name']} - Still: {ep['still_path']}")
        
        if 'images' in tv_data:
            print(f"Backdrops: {len(tv_data['images']['backdrops'])}")
