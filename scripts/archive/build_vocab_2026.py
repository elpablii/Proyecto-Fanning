import os
import pypdf
import collections
import re
import json
import uuid

vocab_dir = r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\Vocabularios\2026"
output_dir = r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data\2026"

pdf_files = [os.path.join(vocab_dir, f) for f in os.listdir(vocab_dir) if f.lower().endswith('.pdf')]

all_items = []
word_counts = collections.Counter()

for pdf_path in pdf_files:
    year = "2026"
    filename = os.path.basename(pdf_path)
    match = re.search(r"Palabras desconocidas de (.*?)(?:\s*\(.*lista definitiva.*\))?\.pdf", filename, re.IGNORECASE)
    if match:
        source_movie = match.group(1).strip()
    else:
        source_movie = filename.replace('.pdf', '').strip()
        
    try:
        reader = pypdf.PdfReader(pdf_path)
        for page in reader.pages:
            text = page.extract_text()
            if not text:
                continue
            lines = text.split('\n')
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                
                line_lower = line.lower()
                if "unknown word" in line_lower or "unknown phrase" in line_lower or "words/phrases" in line_lower or "words and phrases" in line_lower:
                    continue
                
                word = ""
                translation = "No registrada"
                
                if ':' in line:
                    parts = line.split(':', 1)
                    word = parts[0].strip()
                    translation = parts[1].strip()
                elif ' - ' in line:
                    parts = line.split(' - ', 1)
                    word = parts[0].strip()
                    translation = parts[1].strip()
                else:
                    word = line.strip()

                word_clean = word.lower()
                
                if word and len(word) < 45 and len(word) > 1: 
                    word_counts[word_clean] += 1
                    
                    item = {
                        "id": f"v_{uuid.uuid4().hex[:8]}",
                        "word": word,
                        "translation": translation,
                        "source_movie": source_movie,
                        "year_processed": year,
                        "search_key": word_clean
                    }
                    all_items.append(item)
                    
    except Exception as e:
        print(f"Error reading {pdf_path}: {e}")

movies_by_year = collections.defaultdict(list)
for item in all_items:
    item["global_frequency"] = word_counts[item["search_key"]]
    del item["search_key"]
    movie = item["source_movie"]
    word_lower = item.get('word', '').lower()
    movie_lower = movie.lower()
    if 'improve the vocabulary' in word_lower or word_lower == movie_lower:
        continue
    movies_by_year[movie].append(item)

os.makedirs(output_dir, exist_ok=True)
for movie, items in movies_by_year.items():
    safe_name = movie.replace(' ', '_').replace(':', '').replace('/', '_').lower()
    out_file = os.path.join(output_dir, f'vocabulario_{safe_name}.json')
    with open(out_file, 'w', encoding='utf-8') as f:
        json.dump(items, f, ensure_ascii=False, indent=2)
    print(f"Saved {len(items)} words for {movie}")

print(f"Done generating 2026 data. Total files: {len(movies_by_year)}")
