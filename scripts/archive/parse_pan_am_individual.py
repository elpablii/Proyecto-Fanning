import os, pypdf, json, re

dialogues_pdf = r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\Diálogos\Diálogos Series\Dialogues from Pan Am to improve the vocabulary in English.pdf"

def count_dialogues(text):
    return len([1 for p in text.split('-->')[1:] if bool(re.search(r'[a-zA-Z]', p))])

reader = pypdf.PdfReader(dialogues_pdf)
text = ''
for p in reader.pages:
    try:
        text += p.extract_text() + '\n'
    except:
        pass

episode_markers = []
for m in re.finditer(r'S01EP(\d+)', text, re.IGNORECASE):
    episode_markers.append((int(m.group(1)), m.start()))

episode_markers.sort(key=lambda x: x[0])
unique_markers = []
seen = set()
for ep, idx in episode_markers:
    if ep not in seen:
        seen.add(ep)
        unique_markers.append((ep, idx))

ep_dialogues = {}
for i in range(len(unique_markers)):
    ep_num, start_idx = unique_markers[i]
    if i < len(unique_markers) - 1:
        end_idx = unique_markers[i+1][1]
        ep_text = text[start_idx:end_idx]
    else:
        ep_text = text[start_idx:]
    ep_dialogues[ep_num] = count_dialogues(ep_text)

vocab_dir = r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\Vocabularios\2026"
ep_counts = {}
ep_names = {}

for filename in os.listdir(vocab_dir):
    if "pan am" in filename.lower() and filename.endswith('.pdf'):
        pdf_path = os.path.join(vocab_dir, filename)
        reader = pypdf.PdfReader(pdf_path)
        pdf_text = ''
        for page in reader.pages:
            try:
                pdf_text += page.extract_text() + '\n'
            except:
                pass
                
        lines = pdf_text.split('\n')
        current_ep = None
        
        for line in lines:
            line = line.strip()
            if not line: continue
            
            match = re.match(r'Episode\s+(\d+):\s*(.*?)\s*\(', line, re.IGNORECASE)
            if match:
                ep_num = int(match.group(1))
                ep_title = match.group(2).strip()
                current_ep = ep_num
                if ep_num not in ep_counts:
                    ep_counts[ep_num] = 0
                ep_names[ep_num] = f"EP{ep_num}: {ep_title}"
            else:
                if current_ep is not None:
                    if "unknown words from" in line.lower() or "words/phrases" in line.lower():
                        continue
                    if ':' in line or ' - ' in line or (len(line) < 40 and "palabras" not in line.lower() and "words/phrases" not in line.lower()):
                        ep_counts[current_ep] += 1

episodes_data = []
for ep_num in sorted(ep_dialogues.keys()):
    name = ep_names.get(ep_num, f"EP{ep_num}")
    count = ep_counts.get(ep_num, 0)
    dialogues = ep_dialogues.get(ep_num, 0)
    episodes_data.append({
        "name": name,
        "count": count,
        "dialogues": dialogues
    })

print("Episodes Data:", episodes_data)

manifest_path = r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data\manifest.json"
with open(manifest_path, 'r', encoding='utf-8') as f:
    manifest = json.load(f)

for cat in ['2026', 'all']:
    if cat in manifest:
        for movie in manifest[cat].get('movieList', []):
            if movie['title'] == 'Pan Am':
                movie['episodes'] = episodes_data
                movie['count'] = sum(ep['count'] for ep in episodes_data)
                movie['dialogues'] = sum(ep['dialogues'] for ep in episodes_data)
                print(f"Updated Pan Am in {cat}")

with open(manifest_path, 'w', encoding='utf-8') as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)

print("Done.")
