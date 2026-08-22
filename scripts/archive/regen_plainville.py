import json
import os

file_2026 = r'c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data\2026\vocabulario_the_girl_from_plainville.json'
with open(file_2026, 'r', encoding='utf-8') as f:
    data = json.load(f)

out_dir = r'c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data\pelis'

global_vocab = []
episodes_dict = {}

for item in data:
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
