import fitz
import glob
import json
import re
import os

vocab_dir = r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\Vocabularios\2025"
pdf_files = [
    os.path.join(vocab_dir, "Palabras desconocidas de Gambito de Dama (EP 1-3) (lista definitiva).pdf"),
    os.path.join(vocab_dir, "Palabras desconocidas de Gambito de Dama (EP 4-7 + Special Episode) (lista definitiva).pdf")
]

episodes_data = []

def clean_text(t):
    return t.replace('’', "'").replace('‘', "'").replace('“', '"').replace('”', '"').replace('', "'").strip()

for pdf in pdf_files:
    doc = fitz.open(pdf)
    text = ""
    for page in doc:
        text += page.get_text()
        
    lines = text.split('\n')
    current_ep = None
    current_vocab = None
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        if line.startswith("Unknown words") or line.startswith("Queen's Gambit") or line.startswith("(Episodes") or line.startswith("Queens"):
            continue
            
        # Match 'Episode 1: Openings (40 words/phrases in English)'
        ep_match = re.match(r'^(?:Special\s+)?Episode(?:\s+(\d+))?(?:[:\s]*(.*?))?\((\d+)\s*words?', line, re.IGNORECASE)
        if ep_match:
            ep_num = ep_match.group(1)
            count = int(ep_match.group(3))
            
            if ep_num:
                ep_name = f"Gambito de Dama (Episode {ep_num})"
            else:
                ep_name = "Gambito de Dama (Special Episode)"
                
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
    "title": "Gambito de Dama",
    "englishAnalysis": "El vocabulario de Gambito de Dama se centra en el ajedrez competitivo (aperturas, defensas, jugadas), combinado con el lenguaje de los años 60, internados, adopción y la lucha contra las adicciones.",
    "episodes": episodes_data
}

out_path = r'c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data\pelis\Gambito de Dama.json'
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(out_data, f, ensure_ascii=False, indent=2)

print(f"Saved {len(episodes_data)} episodes to {out_path}")
