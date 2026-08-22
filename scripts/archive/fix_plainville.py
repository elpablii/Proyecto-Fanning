import json
import os
import re

file_2026 = r'c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data\2026\vocabulario_the_girl_from_plainville.json'

with open(file_2026, 'r', encoding='utf-8') as f:
    data = json.load(f)

current_source = "The Girl From Plainville"
for item in data:
    word = item.get('word', '').strip()
    trans = item.get('translation', '').strip()
    
    if trans == "No registrada" and "Plainville" in word:
        # e.g. "Plainville (Episodes 1-2)" -> "The Girl From Plainville (Episodes 1-2)"
        m = re.search(r'\((Episodes.*?)\)', word)
        if m:
            current_source = f"The Girl From Plainville ({m.group(1)})"
        else:
            current_source = f"The Girl From Plainville"
    
    item['source_movie'] = current_source

with open(file_2026, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Updated raw 2026 JSON.")

# Now regenerate the pelis JSON
out_dir = r'c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data\pelis'

global_vocab = []
episodes = []
current_ep_name = current_source
current_ep_vocab = []

for item in data:
    word = item.get('word', '').strip()
    trans = item.get('translation', '').strip()
    source = item.get('source_movie')
    
    if trans == "No registrada":
        continue
    
    if source != current_ep_name:
        if len(current_ep_vocab) > 0:
            episodes.append({
                "name": current_ep_name,
                "vocabulary": current_ep_vocab
            })
        current_ep_name = source
        current_ep_vocab = []
        
    entry = {"word": word, "translation": trans}
    global_vocab.append(entry)
    current_ep_vocab.append(entry)

if len(current_ep_vocab) > 0:
    episodes.append({
        "name": current_ep_name,
        "vocabulary": current_ep_vocab
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
