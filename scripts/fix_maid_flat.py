import json
import uuid
import hashlib

# Read the correct structure
with open('fanning-dashboard/public/data/pelis/Maid.json', 'r', encoding='utf-8') as f:
    correct_data = json.load(f)

# Create the flat array of words
flat_words = []
for ep in correct_data.get('episodes', []):
    ep_name = ep['name'] # e.g. "Maid (Episode 1)"
    for v in ep.get('vocabulary', []):
        word = v['word']
        trans = v['translation']
        
        # Generate a stable ID
        raw_id = f"{ep_name}_{word}_{trans}"
        v_id = "v_" + hashlib.md5(raw_id.encode()).hexdigest()[:8]
        
        flat_words.append({
            "id": v_id,
            "word": word,
            "translation": trans,
            "source_movie": ep_name,
            "year_processed": "2026",
            "global_frequency": 2 # dummy value
        })

# Write to the 2026 vocab file
with open('fanning-dashboard/public/data/2026/vocabulario_maid.json', 'w', encoding='utf-8') as f:
    json.dump(flat_words, f, ensure_ascii=False, indent=2)

print(f"Generated {len(flat_words)} words with correct episode separation.")
