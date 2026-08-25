import json
import uuid
import hashlib

with open('fanning-dashboard/public/data/pelis/Dream Productions.json', 'r', encoding='utf-8') as f:
    correct_data = json.load(f)

flat_words = []
for ep in correct_data.get('episodes', []):
    ep_name = ep['name']
    for v in ep.get('vocabulary', []):
        word = v['word']
        trans = v['translation']
        
        raw_id = f"{ep_name}_{word}_{trans}"
        v_id = "v_" + hashlib.md5(raw_id.encode()).hexdigest()[:8]
        
        flat_words.append({
            "id": v_id,
            "word": word,
            "translation": trans,
            "source_movie": ep_name,
            "year_processed": "2025",
            "global_frequency": 2
        })

with open('fanning-dashboard/public/data/2025/vocabulario_dream_productions.json', 'w', encoding='utf-8') as f:
    json.dump(flat_words, f, ensure_ascii=False, indent=2)

print(f"Generated {len(flat_words)} words with correct episode separation.")
