import fitz
import glob
import json
import re

pdf_files = glob.glob('Vocabularios/2026/Palabras desconocidas de The Perfect Couple*.pdf')
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
            
        if line.startswith("Unknown words") or line.startswith("Plainville") or line.startswith("(Episodes"):
            continue
            
        ep_match = re.match(r'^Episode (\d+):\s*(.*)\((\d+)\s*words?', line, re.IGNORECASE)
        if ep_match:
            ep_num = ep_match.group(1)
            ep_name = ep_match.group(2).strip()
            count = int(ep_match.group(3))
            current_ep = {
                "name": f"The Perfect Couple (Episode {ep_num})",
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

# Guardar
out_data = {
    "title": "The Perfect Couple",
    "englishAnalysis": "Miniserie de misterio e intriga que destaca por un vocabulario lleno de secretos familiares, jerga de alta sociedad y lenguaje relacionado a investigaciones policiales.",
    "episodes": episodes_data
}

out_path = 'fanning-dashboard/public/data/pelis/The Perfect Couple.json'
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(out_data, f, ensure_ascii=False, indent=2)

print(f"Saved {len(episodes_data)} episodes to {out_path}")
