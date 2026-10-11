import fitz
import json
import re

pdf_path = r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\Diálogos\Diálogos Series\Dialogues from Obi-Wan Kenobi to improve the vocabulary in English.pdf"
doc = fitz.open(pdf_path)

text = ""
for page in doc:
    text += page.get_text()

# Buscar 'EP1: Part I', etc.
episodes_text = re.split(r'\bEP\d+:', text, flags=re.IGNORECASE)
episodes_text = episodes_text[1:]

dialogue_counts = []

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

json_path = r'c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data\pelis\Obi-Wan Kenobi.json'
with open(json_path, 'r', encoding='utf-8') as f:
    d = json.load(f)

if 'episodes' in d:
    for i, ep in enumerate(d['episodes']):
        if i < len(dialogue_counts):
            ep['dialogues'] = dialogue_counts[i]

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(d, f, ensure_ascii=False, indent=2)

print("Updated Obi-Wan Kenobi.json with dialogue counts")
