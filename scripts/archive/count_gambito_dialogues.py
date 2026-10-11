import fitz
import json
import re

pdf_paths = [
    'Diálogos/Diálogos Series/Dialogues from Queen\'s Gambit to improve the vocabulary in English.pdf',
    'Diálogos/Diálogos Series/Dialogues from Creating Queen\'s Gambit to improve the vocabulary in English.pdf'
]

dialogue_counts = []

# Process main series (7 episodes)
doc = fitz.open(pdf_paths[0])
text = ""
for page in doc:
    text += page.get_text()

episodes_text = re.split(r'\bS01EP\d+:', text, flags=re.IGNORECASE)
episodes_text = episodes_text[1:]

for i, ep_text in enumerate(episodes_text):
    blocks = re.split(r'\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}', ep_text)
    count = 0
    for block in blocks[1:]:
        block_lines = block.strip().split('\n')
        valid_text = " ".join([l for l in block_lines if not re.match(r'^\s*\d+\s*$', l)])
        if re.search(r'[a-zA-ZáéíóúÁÉÍÓÚñÑ]', valid_text):
            count += 1
    dialogue_counts.append(count)
    print(f"Episode {i+1} dialogues: {count}")

# Process special episode
doc2 = fitz.open(pdf_paths[1])
text2 = ""
for page in doc2:
    text2 += page.get_text()

blocks = re.split(r'\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}', text2)
count = 0
for block in blocks[1:]:
    block_lines = block.strip().split('\n')
    valid_text = " ".join([l for l in block_lines if not re.match(r'^\s*\d+\s*$', l)])
    if re.search(r'[a-zA-ZáéíóúÁÉÍÓÚñÑ]', valid_text):
        count += 1
dialogue_counts.append(count)
print(f"Special Episode dialogues: {count}")

json_path = 'fanning-dashboard/public/data/pelis/Gambito de Dama.json'
with open(json_path, 'r', encoding='utf-8') as f:
    d = json.load(f)

if 'episodes' in d:
    for i, ep in enumerate(d['episodes']):
        if i < len(dialogue_counts):
            ep['dialogues'] = dialogue_counts[i]

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(d, f, ensure_ascii=False, indent=2)

print("Updated Gambito de Dama.json with dialogue counts")
