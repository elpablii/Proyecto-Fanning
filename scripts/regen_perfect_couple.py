import json
import os

file_2026 = r'c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data\2026\vocabulario_the_perfect_couple.json'
with open(file_2026, 'r', encoding='utf-8') as f:
    new_data = json.load(f)

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
    
    # Ignore the broken "(Episodes)" source
    if source == "The Perfect Couple (Episodes)":
        source = "The Perfect Couple (Episode 6)" # just lump it into episode 6
        
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

title = "The Perfect Couple"
desc = "Serie de misterio y drama llena de tensiones familiares y secretos. El vocabulario incluye términos sobre bodas, investigaciones policiales, lujo, y descripciones emocionales intensas."

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
