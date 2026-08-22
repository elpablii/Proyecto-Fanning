import json
import os

input_file = r'c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data\vocabulario.json'
output_dir = r'c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data'

with open(input_file, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Find all movies from 2023
movies_2023 = set(item['source_movie'] for item in data if item.get('year_processed') == '2023')
print("Movies from 2023:", movies_2023)

# Filter items for these movies and save them
for movie in movies_2023:
    movie_data = [item for item in data if item.get('source_movie') == movie]
    safe_name = movie.replace(' ', '_').replace(':', '').replace('/', '_').lower()
    out_file = os.path.join(output_dir, f'vocabulario_{safe_name}.json')
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(movie_data, f, ensure_ascii=False, indent=2)
    print(f"Saved {len(movie_data)} words to {out_file}")
