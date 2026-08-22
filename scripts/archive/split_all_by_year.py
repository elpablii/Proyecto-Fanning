import json
import os
import glob
import shutil

input_file = r'c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data\vocabulario.json'
output_dir = r'c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data'

# Read entire data
with open(input_file, 'r', encoding='utf-8') as f:
    data = json.load(f)

# Group by year and movie
movies_by_year = {}

for item in data:
    year = str(item.get('year_processed', 'Unknown'))
    movie = item.get('source_movie')
    if not movie:
        continue
        
    if year not in movies_by_year:
        movies_by_year[year] = {}
        
    if movie not in movies_by_year[year]:
        movies_by_year[year][movie] = []
        
    # Title filter
    word_lower = item.get('word', '').lower()
    movie_lower = movie.lower()
    if 'improve the vocabulary' in word_lower or word_lower == movie_lower:
        continue
        
    movies_by_year[year][movie].append(item)

# Write to folders
for year, movies in movies_by_year.items():
    year_dir = os.path.join(output_dir, year)
    os.makedirs(year_dir, exist_ok=True)
    
    print(f"--- Processing Year: {year} ---")
    for movie, items in movies.items():
        if not items:
            continue
        safe_name = movie.replace(' ', '_').replace(':', '').replace('/', '_').lower()
        out_file = os.path.join(year_dir, f'vocabulario_{safe_name}.json')
        with open(out_file, 'w', encoding='utf-8') as f:
            json.dump(items, f, ensure_ascii=False, indent=2)
        print(f"Saved {len(items)} words for {movie} in {year}/{os.path.basename(out_file)}")

# Clean up old files in root of public/data
old_files = glob.glob(os.path.join(output_dir, 'vocabulario_*.json'))
for f in old_files:
    if os.path.basename(f) != 'vocabulario.json':  # Don't delete the main giant file
        os.remove(f)
        print(f"Removed old root file: {os.path.basename(f)}")

print("Done grouping by year!")
