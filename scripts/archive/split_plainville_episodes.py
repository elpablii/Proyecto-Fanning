import json
import os
import re
import math

file_2026 = r'c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data\2026\vocabulario_the_girl_from_plainville.json'

with open(file_2026, 'r', encoding='utf-8') as f:
    data = json.load(f)

blocks = []
current_block = []
current_marker = "The Girl From Plainville"

for item in data:
    word = item.get('word', '').strip()
    trans = item.get('translation', '').strip()
    
    if trans == "No registrada" and "Plainville" in word:
        if current_block:
            blocks.append((current_marker, current_block))
        m = re.search(r'\((Episode.*?)\)', word)
        if m:
            current_marker = m.group(1)
        elif re.search(r'\((Episodes.*?)\)', word):
            current_marker = re.search(r'\((Episodes.*?)\)', word).group(1)
        else:
            current_marker = "Episodes"
        current_block = []
    else:
        if trans != "No registrada":
            current_block.append(item)

if current_block:
    blocks.append((current_marker, current_block))

# Now we have blocks with markers like "Episode 1" or "Episodes 1-2"
# If they are already "Episode X", we don't need to split again, but let's assume they were split.
# Wait, currently they are already "Episode 1" in the JSON because split_plainville_episodes ran!
# So the markers are "Episode 1", "Episode 2", etc.

new_data = []
for marker, block in blocks:
    # If the marker is already "Episode X", don't split
    if re.match(r'Episode \d+$', marker):
        ep_name = marker
        new_data.append({
            "id": f"v_marker_{ep_name.replace(' ', '_')}",
            "word": f"The Girl From Plainville ({ep_name})",
            "translation": "No registrada",
            "source_movie": f"The Girl From Plainville ({ep_name})",
            "year_processed": "2026",
            "global_frequency": 1
        })
        for item in block:
            new_item = item.copy()
            new_item['source_movie'] = f"The Girl From Plainville ({ep_name})"
            new_data.append(new_item)
    else:
        # Check if it needs splitting (e.g. "Episodes 1-2")
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
                    "word": f"The Girl From Plainville ({ep_name})",
                    "translation": "No registrada",
                    "source_movie": f"The Girl From Plainville ({ep_name})",
                    "year_processed": "2026",
                    "global_frequency": 1
                })
                
                start_idx = i * words_per_ep
                end_idx = min((i + 1) * words_per_ep, len(block))
                chunk = block[start_idx:end_idx]
                
                for item in chunk:
                    new_item = item.copy()
                    new_item['source_movie'] = f"The Girl From Plainville ({ep_name})"
                    new_data.append(new_item)
        else:
            new_data.append({
                "id": f"v_marker_{marker}",
                "word": f"The Girl From Plainville ({marker})",
                "translation": "No registrada",
                "source_movie": f"The Girl From Plainville ({marker})",
                "year_processed": "2026",
                "global_frequency": 1
            })
            for item in block:
                new_item = item.copy()
                new_item['source_movie'] = f"The Girl From Plainville ({marker})"
                new_data.append(new_item)

with open(file_2026, 'w', encoding='utf-8') as f:
    json.dump(new_data, f, ensure_ascii=False, indent=2)

print("Split episodes in raw JSON.")

# Now regenerate the pelis JSON
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

title = "The Girl From Plainville"
desc = "Miniserie que ofrece un vocabulario juvenil combinado con jerga legal y policial. Debido a la temática de los mensajes de texto y la persuasión, encontrarás muchas expresiones relacionadas con la culpa, el estado mental, los tribunales y el lenguaje digital adolescente."

out_json = {
    "title": title,
    "englishAnalysis": desc,
    "vocabulary": global_vocab,
    "episodes": episodes
}

out_path = os.path.join(out_dir, f"{title}.json")
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(out_json, f, ensure_ascii=False, indent=2)

print(f"Regenerated {out_path} with {len(global_vocab)} words across {len(episodes)} episodes.")
