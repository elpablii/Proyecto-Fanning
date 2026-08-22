import json
import os
import re
import math

file_2026 = r'c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data\2026\vocabulario_the_perfect_couple.json'
series_title = "The Perfect Couple"
series_desc = "Serie de misterio y drama llena de tensiones familiares y secretos. El vocabulario incluye términos sobre bodas, investigaciones policiales, lujo, y descripciones emocionales intensas."

with open(file_2026, 'r', encoding='utf-8') as f:
    data = json.load(f)

blocks = []
current_block = []
current_marker = series_title

for item in data:
    word = item.get('word', '').strip()
    trans = item.get('translation', '').strip()
    
    # In "The Perfect Couple", the marker is literally "(Episodes X-Y)", without the series title
    # or maybe "The Perfect Couple (Episodes 1-2)". The example shows just "(Episodes 5-6)"
    if trans == "No registrada":
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

new_data = []
for marker, block in blocks:
    if re.match(r'Episode \d+$', marker):
        ep_name = marker
        new_data.append({
            "id": f"v_marker_{ep_name.replace(' ', '_')}",
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
    else:
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
            # If it's just "The Perfect Couple" (e.g. no marker matched)
            if marker == series_title:
                new_data.append({
                    "id": f"v_marker_{marker}",
                    "word": f"{marker}",
                    "translation": "No registrada",
                    "source_movie": f"{marker}",
                    "year_processed": "2026",
                    "global_frequency": 1
                })
                for item in block:
                    new_item = item.copy()
                    new_item['source_movie'] = f"{marker}"
                    new_data.append(new_item)
            else:
                new_data.append({
                    "id": f"v_marker_{marker}",
                    "word": f"{series_title} ({marker})",
                    "translation": "No registrada",
                    "source_movie": f"{series_title} ({marker})",
                    "year_processed": "2026",
                    "global_frequency": 1
                })
                for item in block:
                    new_item = item.copy()
                    new_item['source_movie'] = f"{series_title} ({marker})"
                    new_data.append(new_item)

with open(file_2026, 'w', encoding='utf-8') as f:
    json.dump(new_data, f, ensure_ascii=False, indent=2)

print("Split episodes in raw JSON for The Perfect Couple.")

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

# If everything went into "The Perfect Couple" due to no markers, we need to handle that, but episodes dict handles it.

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
