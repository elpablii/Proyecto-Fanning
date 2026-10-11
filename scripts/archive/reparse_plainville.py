import fitz
import glob
import json
import re
import os

pdf_files = glob.glob('Vocabularios/2026/Palabras desconocidas de The Girl From Plainville*.pdf')

episodes_data = []

def clean_text(t):
    return t.replace('’', "'").replace('‘', "'").replace('“', '"').replace('”', '"').strip()

for pdf in sorted(pdf_files):
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
            
        if line.startswith("Unknown words") or line.startswith("Plainville (Episodes"):
            continue
            
        ep_match = re.match(r'^Episode (\d+):\s*(.*)\((\d+)\s*words?', line, re.IGNORECASE)
        if ep_match:
            ep_num = ep_match.group(1)
            ep_name = ep_match.group(2).strip()
            count = int(ep_match.group(3))
            current_ep = {
                "name": f"The Girl From Plainville (Episode {ep_num})",
                "count": count,
                "vocabulary": []
            }
            episodes_data.append(current_ep)
            current_vocab = None
            continue
            
        # Si no es un marcador de episodio, debe ser vocabulario
        if current_ep is not None:
            # Buscar el primer separador de dos puntos o un guion
            # Ojo: a veces el "word" tiene "(acotación):" 
            if ':' in line:
                parts = line.split(':', 1)
                word = clean_text(parts[0])
                trans = clean_text(parts[1])
                current_vocab = {"word": word, "translation": trans}
                current_ep["vocabulary"].append(current_vocab)
            else:
                # Es una continuación de la traducción anterior
                if current_vocab:
                    current_vocab["translation"] += " " + clean_text(line)

# Validar que los conteos sean correctos
for ep in episodes_data:
    expected = ep["count"]
    actual = len(ep["vocabulary"])
    if expected != actual:
        print(f"WARNING: {ep['name']} expected {expected} but got {actual}")
    else:
        print(f"OK: {ep['name']} - {actual} words")

# Guardar en el JSON
out_data = {
    "title": "The Girl From Plainville",
    "englishAnalysis": "Miniserie que ofrece un vocabulario juvenil combinado con jerga legal y policial. Debido a la temática de los mensajes de texto y la persuasión, encontrarás muchas expresiones relacionadas con la culpa, el estado mental, los tribunales y el lenguaje digital adolescente.",
    "episodes": episodes_data
}

out_path = 'fanning-dashboard/public/data/pelis/The Girl From Plainville.json'
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(out_data, f, ensure_ascii=False, indent=2)

print(f"Saved {len(episodes_data)} episodes to {out_path}")
