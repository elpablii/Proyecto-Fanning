import json
import os
import re

def clean_movie_title(raw_title):
    title = raw_title
    title = re.sub(r'\(lista.*?\)', '', title, flags=re.IGNORECASE)
    title = re.sub(r'\(S\d+EP.*?\)', '', title, flags=re.IGNORECASE)
    title = re.sub(r'\(Season.*?\)', '', title, flags=re.IGNORECASE)
    title = re.sub(r'parte \d', '', title, flags=re.IGNORECASE)
    if re.match(r'^Cars I$', title.strip(), re.IGNORECASE): title = "Cars"
    if re.match(r'^Cars II$', title.strip(), re.IGNORECASE): title = "Cars 2"
    return title.strip()

data_dir = r'c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data\2026'
out_dir = r'c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data\pelis'

movies = [
    'vocabulario_a_rainy_day_in_new_york.json',
    'vocabulario_family_switch.json',
    'vocabulario_a_complete_unknown.json',
    'vocabulario_a_minecraft_movie.json',
    'vocabulario_love_actually.json',
    'vocabulario_orgullo_y_prejuicio.json',
    'vocabulario_zootopia_i.json',
    'vocabulario_schindler\'s_list.json',
    'vocabulario_interestellar.json'
]

for filename in movies:
    filepath = os.path.join(data_dir, filename)
    if not os.path.exists(filepath):
        print(f"File not found: {filename}")
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if not data or not isinstance(data, list):
        print(f"Invalid data in {filename}")
        continue
        
    raw_title = data[0].get('source_movie', '')
    title = clean_movie_title(raw_title)
    
    if not title:
        print(f"No title found in {filename}")
        continue
        
    vocab_list = []
    for item in data:
        word = item.get('word', '').strip()
        trans = item.get('translation', '').strip()
        if word:
            vocab_list.append({"word": word, "translation": trans})
            
    out_json = {
        "title": title,
        "englishAnalysis": "",
        "vocabulary": vocab_list
    }
    
    out_path = os.path.join(out_dir, f"{title}.json")
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(out_json, f, ensure_ascii=False, indent=2)
        
    print(f"Generated {out_path} with {len(vocab_list)} words.")
