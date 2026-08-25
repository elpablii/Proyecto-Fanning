import fitz
import json
import re
import os

pdf_path = r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\Vocabularios\2025\Palabras desconocidas de Dream Productions (de Intensamente) (lista definitiva).pdf"

episodes_data = []

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
    if line.startswith("Unknown words") or line.startswith("Dream Productions") or line.startswith("(From Inside Out)"):
        continue
        
    ep_match = re.match(r'^Episode (\d+)(?:[:\s]*(.*?))?\((\d+)\s*words?', line, re.IGNORECASE)
    if ep_match:
        ep_num = ep_match.group(1)
        count = int(ep_match.group(3))
        ep_name = f"Dream Productions (Episode {ep_num})"
            
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
    "title": "Dream Productions",
    "englishAnalysis": "El vocabulario de Dream Productions destaca por su jerga relacionada a la producción audiovisual (guiones, cámaras, dirección), expresiones preadolescentes, y términos del entorno laboral hiperactivo.",
    "episodes": episodes_data
}

out_path = r'c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data\pelis\Dream Productions.json'
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(out_data, f, ensure_ascii=False, indent=2)

print(f"Saved {len(episodes_data)} episodes to {out_path}")
