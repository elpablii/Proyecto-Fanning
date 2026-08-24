import fitz
import glob
import json
import re

pdf_files = glob.glob('Vocabularios/2026/Palabras desconocidas de Maid*.pdf')
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
            
        if line.startswith("Unknown words") or line.startswith("Maid") or line.startswith("(Episodes"):
            continue
            
        # Match 'Episode 1: Dollar Store (57 words/phrases)'
        ep_match = re.match(r'^Episode (\d+)(?:[:\s]*(.*?))?\((\d+)\s*words?', line, re.IGNORECASE)
        if ep_match:
            ep_num = ep_match.group(1)
            count = int(ep_match.group(3))
            current_ep = {
                "name": f"Maid (Episode {ep_num})",
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
    "title": "Maid",
    "englishAnalysis": "El vocabulario de Maid se caracteriza por lenguaje informal, expresiones cotidianas de supervivencia económica, terminología legal básica sobre custodia y asistencia del gobierno, y un uso frecuente de jerga cruda o 'slang' estadounidense.",
    "episodes": episodes_data
}

out_path = 'fanning-dashboard/public/data/pelis/Maid.json'
with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(out_data, f, ensure_ascii=False, indent=2)

print(f"Saved {len(episodes_data)} episodes to {out_path}")
