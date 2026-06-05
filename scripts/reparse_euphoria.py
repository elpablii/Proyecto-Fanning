import os
import pypdf
import json
import re

vocab_dir = r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\Vocabularios"
manifest_path = r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data\manifest.json"

eu_files = []
for root, dirs, files in os.walk(vocab_dir):
    for f in files:
        if f.lower().endswith('.pdf') and 'euphoria' in f.lower():
            eu_files.append(os.path.join(root, f))

eu_episodes = []

def count_words_single(pdf_path):
    word_count = 0
    reader = pypdf.PdfReader(pdf_path)
    for page in reader.pages:
        text = page.extract_text()
        if not text: continue
        lines = text.split('\n')
        for line in lines:
            line = line.strip()
            if not line: continue
            if "unknown words" in line.lower() or "words/phrases" in line.lower() and not line.startswith("Episode") and not line.startswith("Special"):
                continue
            if ':' in line or ' - ' in line or (len(line) < 40 and "palabras/frases" not in line and "words/phrases" not in line):
                word_count += 1
    return word_count

def parse_grouped_pdf(pdf_path, season_prefix):
    reader = pypdf.PdfReader(pdf_path)
    text = ""
    for page in reader.pages:
        text += page.extract_text() + "\n"
        
    lines = text.split('\n')
    
    episodes = []
    current_ep = None
    
    for line in lines:
        line = line.strip()
        if not line: continue
        if "unknown words" in line.lower() or "words/phrases" in line.lower() and not line.startswith("Episode") and not line.startswith("Special"):
            continue
            
        # Detect new episode header
        # Matches "Episode 1: Pilot (" or "Special Episode 1: Trouble (" 
        match = re.match(r'((?:Special\s+)?Episode\s+\d+:\s*.*?)\s*\(', line, re.IGNORECASE)
        if match:
            ep_title = match.group(1).strip()
            
            if "Special" in ep_title:
                ep_title = ep_title.replace("Special Episode ", "Special ")
            else:
                ep_title = f"S0{season_prefix}{ep_title.replace('Episode ', 'EP')}"
                
            current_ep = {"name": ep_title, "count": 0}
            episodes.append(current_ep)
        else:
            if current_ep:
                if ':' in line or ' - ' in line:
                    current_ep["count"] += 1
                else:
                    if len(line) < 40 and not "palabras/frases" in line and not "words/phrases" in line:
                        current_ep["count"] += 1
                        
    return episodes

for pdf_path in eu_files:
    filename = os.path.basename(pdf_path)
    
    season = "1" if "S01" in filename else "2"
    parsed = parse_grouped_pdf(pdf_path, season)
    if not parsed:
        parsed = [{"name": filename.replace('.pdf', ''), "count": count_words_single(pdf_path)}]
    eu_episodes.extend(parsed)

# Sort
def sort_key(ep):
    name = ep["name"]
    if "S01EP" in name:
        num = int(re.search(r'EP(\d+)', name).group(1))
        return (1, num)
    elif "Special" in name:
        num = int(re.search(r'Special (\d+)', name).group(1))
        return (2, num)
    elif "S02EP" in name:
        num = int(re.search(r'EP(\d+)', name).group(1))
        return (3, num)
    else:
        return (4, 0)

eu_episodes.sort(key=sort_key)

with open(manifest_path, 'r', encoding='utf-8') as f:
    manifest = json.load(f)

# Euphoria is only in 2025 and all
for cat in ["2025", "all"]:
    if cat not in manifest: continue
    for movie in manifest[cat].get("movieList", []):
        if movie["title"] == "Euphoria":
            movie["episodes"] = eu_episodes
            movie["count"] = sum(e["count"] for e in eu_episodes)
            print(f"Updated Euphoria in {cat} with {len(eu_episodes)} episodes.")

with open(manifest_path, 'w', encoding='utf-8') as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)

print("Euphoria successfully reparsed!")
