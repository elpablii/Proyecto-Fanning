import fitz
import json
import re
import os

pdf_path = r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\Vocabularios\2026\Palabras desconocidas de Obi-Wan Kenobi (lista definitiva).pdf"

episodes_data = []

roman_to_int = {
    'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6
}

def clean_text(t):
    return t.replace('’', "'").replace('‘', "'").replace('“', '"').replace('”', '"').strip()

doc = fitz.open(pdf_path)
text = ""
for page in doc:
    text += page.get_text()
    
lines = text.split('\n')
current_ep = None
current_vocab = None

for line in lines:
    line = line.strip()
    if not line: continue
    if line.startswith("Unknown words") or line.startswith("Obi-Wan") or line.startswith("improve the vocabulary"):
        continue
        
    # Match 'Part I (23 words/phrases):'
    ep_match = re.match(r'^Part\s+([IVXLCDM]+)\s*\(\s*(\d+)\s*words?', line, re.IGNORECASE)
    if ep_match:
        roman = ep_match.group(1).upper()
        ep_num = roman_to_int.get(roman, 1)
        count = int(ep_match.group(2))
        
        # User requested: "los episodios con números en romano son así, así están titulados"
        # So we keep Part I, Part II as the episode title, or we can use "Obi-Wan Kenobi (Part I)"
        ep_name = f"Obi-Wan Kenobi (Part {roman})"
            
        current_ep = {
            "name": ep_name,
            "count": count,
            "vocabulary": []
        }
        episodes_data.append(current_ep)
        current_vocab = None
        continue
        
    if current_ep is not None:
        if ':' in line:
            parts = line.split(':', 1)
            word = clean_text(parts[0])
            trans = clean_text(parts[1])
            current_vocab = {"word": word, "translation": trans}
            current_ep["vocabulary"].append(current_vocab)
        else:
            if current_vocab:
                current_vocab["translation"] += " " + clean_text(line)

out_data = {
    "title": "Obi-Wan Kenobi",
    "englishAnalysis": "El vocabulario de Obi-Wan Kenobi se sumerge en el lenguaje militar imperial, terminología de ciencia ficción intergaláctica, jerga de los bajos fondos de la galaxia y un tono solemne Jedi.",
    "episodes": episodes_data
}

out_path = r'c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data\pelis\Obi-Wan Kenobi.json'
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(out_data, f, ensure_ascii=False, indent=2)

print(f"Saved {len(episodes_data)} episodes to {out_path}")
