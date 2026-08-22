import json
import os
import re
import math

file_2026 = r'c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data\2026\vocabulario_the_perfect_couple.json'
series_title = "The Perfect Couple"
series_desc = "Serie de misterio y drama llena de tensiones familiares y secretos. El vocabulario incluye términos sobre bodas, investigaciones policiales, lujo, y descripciones emocionales intensas."

with open(file_2026, 'r', encoding='utf-8') as f:
    data = json.load(f)

# The raw file has blocks that start with words like "(Episodes 5-6)"
# But the items are not in chronological order! 5-6 is first, then 1-2, then 3-4.
# We will collect words into dict keyed by "1-2", "3-4", "5-6".
blocks = {}
current_marker = "Episodes" # fallback

for item in data:
    word = item.get('word', '').strip()
    trans = item.get('translation', '').strip()
    
    # Check if this item is a marker
    m = re.search(r'\((Episode.*?)\)', word)
    if trans == "No registrada" and m:
        # It's a real marker!
        current_marker = m.group(1).replace("Episodes", "").strip() # e.g. "5-6"
    else:
        # Not a marker, just a word (even if trans is No registrada)
        if trans != "No registrada":
            if current_marker not in blocks:
                blocks[current_marker] = []
            blocks[current_marker].append(item)

new_data = []

# Now sort blocks by the first number
def get_start_ep(marker):
    m = re.search(r'(\d+)', marker)
    return int(m.group(1)) if m else 999

sorted_markers = sorted(blocks.keys(), key=get_start_ep)

for marker in sorted_markers:
    block = blocks[marker]
    m = re.search(r'(\d+)-(\d+)', marker)
    if m:
        ep_start = int(m.group(1))
        ep_end = int(m.group(2))
        
        num_eps = ep_end - ep_start + 1
        words_per_ep = math.ceil(len(block) / num_eps)
        
        for i in range(num_eps):
            ep_num = ep_start + i
            ep_name = f"Episode {ep_num}"
            
            new_data.append({
                "id": f"v_marker_ep_{ep_num}",
                "word": f"{series_title} ({ep_name})",
                "translation": "No registrada",
                "source_movie": f"{series_title} ({ep_name})",
                "year_processed": "2026",
                "global_frequency": 1
            })
            
            start_idx = i * words_per_ep
            end_idx = min((i + 1) * words_per_ep, len(block))
            chunk = block[start_idx:end_idx]
            
            for item in chunk:
                new_item = item.copy()
                new_item['source_movie'] = f"{series_title} ({ep_name})"
                new_data.append(new_item)
    else:
        # If no range found, just lump it
        ep_name = f"Episode {marker}"
        new_data.append({
            "id": f"v_marker_ep_{marker}",
            "word": f"{series_title} ({ep_name})",
            "translation": "No registrada",
            "source_movie": f"{series_title} ({ep_name})",
            "year_processed": "2026",
            "global_frequency": 1
        })
        for item in block:
            new_item = item.copy()
            new_item['source_movie'] = f"{series_title} ({ep_name})"
            new_data.append(new_item)

# Save back to raw JSON
with open(file_2026, 'w', encoding='utf-8') as f:
    json.dump(new_data, f, ensure_ascii=False, indent=2)

print("Split episodes correctly in raw JSON for The Perfect Couple.")

# Generate pelis JSON
out_dir = r'c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data\pelis'
global_vocab = []
episodes_dict = {}

for item in new_data:
    if item.get('translation') == "No registrada":
        continue
    word = item.get('word', '').strip()
    trans = item.get('translation', '').strip()
    source = item.get('source_movie')
    
    entry = {"word": word, "translation": trans}
    global_vocab.append(entry)
    
    if source not in episodes_dict:
        episodes_dict[source] = []
    episodes_dict[source].append(entry)

episodes = []
for name, vocab in episodes_dict.items():
    episodes.append({
        "name": name,
        "vocabulary": vocab
    })

out_json = {
    "title": series_title,
    "englishAnalysis": series_desc,
    "vocabulary": global_vocab,
    "episodes": episodes
}

out_path = os.path.join(out_dir, f"{series_title}.json")
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(out_json, f, ensure_ascii=False, indent=2)

print(f"Regenerated {out_path} with {len(global_vocab)} words across {len(episodes)} episodes.")
