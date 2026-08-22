import json
import os
import re

def clean_movie_title(raw_title):
    title = raw_title
    title = re.sub(r'\(lista.*?\)', '', title, flags=re.IGNORECASE)
    title = re.sub(r'\(S\d+EP.*?\)', '', title, flags=re.IGNORECASE)
    title = re.sub(r'\(Season.*?\)', '', title, flags=re.IGNORECASE)
    title = re.sub(r'parte \d', '', title, flags=re.IGNORECASE)
    return title.strip()

data_dir = r'c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data\2026'
out_dir = r'c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data\pelis'

filename = 'vocabulario_the_girl_from_plainville.json'
filepath = os.path.join(data_dir, filename)

with open(filepath, 'r', encoding='utf-8') as f:
    data = json.load(f)

global_vocab = []
episodes = []
current_ep_name = "Episodios Generales"
current_ep_vocab = []

for item in data:
    word = item.get('word', '').strip()
    trans = item.get('translation', '').strip()
    
    if trans == "No registrada":
        if "Episodes" in word or "Plainville" in word:
            # Save previous episode if it has words
            if len(current_ep_vocab) > 0:
                episodes.append({
                    "name": current_ep_name,
                    "vocabulary": current_ep_vocab
                })
            
            # Extract just the episode part, e.g., "Episodes 1-2"
            m = re.search(r'\((Episodes.*?)\)', word)
            if m:
                current_ep_name = m.group(1)
            else:
                current_ep_name = word.replace("Plainville", "").strip(" ()") or "Episodio"
                
            current_ep_vocab = []
        continue
    
    if word and trans:
        entry = {"word": word, "translation": trans}
        global_vocab.append(entry)
        current_ep_vocab.append(entry)

# Append the last episode
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

print(f"Generated {out_path} with {len(global_vocab)} total words across {len(episodes)} episodes.")
