import os
import pypdf
import json
import re

vocab_dir = r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\Vocabularios"
out_path = r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data\pelis\Euphoria.json"

eu_files = []
for root, dirs, files in os.walk(vocab_dir):
    for f in files:
        if f.lower().endswith('.pdf') and 'euphoria' in f.lower():
            eu_files.append(os.path.join(root, f))

eu_episodes = []

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
            
        match = re.match(r'((?:Special\s+)?Episode\s+\d+:\s*.*?)\s*\(', line, re.IGNORECASE)
        if match:
            ep_title = match.group(1).strip()
            
            if "Special" in ep_title:
                ep_title = ep_title.replace("Special Episode ", "Special ")
            else:
                ep_title = f"S0{season_prefix}E{ep_title.replace('Episode ', '')}"
                
            current_ep = {"name": ep_title, "count": 0, "vocabulary": []}
            episodes.append(current_ep)
        else:
            if current_ep:
                if ':' in line or ' - ' in line:
                    if ':' in line:
                        parts = line.split(':', 1)
                    else:
                        parts = line.split(' - ', 1)
                    
                    word = parts[0].strip()
                    trans = parts[1].strip()
                    
                    if len(word) > 0 and len(trans) > 0:
                        current_ep["vocabulary"].append({
                            "word": word,
                            "translation": trans
                        })
                        current_ep["count"] += 1
                        
    return episodes

for pdf_path in eu_files:
    filename = os.path.basename(pdf_path)
    season = "1" if "S01" in filename else "2"
    parsed = parse_grouped_pdf(pdf_path, season)
    eu_episodes.extend(parsed)

# Sort episodes
def sort_key(ep):
    name = ep["name"]
    if "S01E" in name:
        num = int(re.search(r'E(\d+)', name).group(1))
        return (1, num)
    elif "Special" in name:
        num = int(re.search(r'Special (\d+)', name).group(1))
        return (2, num)
    elif "S02E" in name:
        num = int(re.search(r'E(\d+)', name).group(1))
        return (3, num)
    else:
        return (4, 0)

eu_episodes.sort(key=sort_key)

total_count = sum(ep["count"] for ep in eu_episodes)

# Base JSON structure
data = {
    "title": "Euphoria",
    "original_title": "Euphoria",
    "overview": "",
    "englishAnalysis": "",
    "level": "B2",
    "count": total_count,
    "episodes": eu_episodes
}

if os.path.exists(out_path):
    try:
        with open(out_path, 'r', encoding='utf-8') as f:
            old_data = json.load(f)
            data["overview"] = old_data.get("overview", "")
            data["englishAnalysis"] = old_data.get("englishAnalysis", "")
            data["level"] = old_data.get("level", "B2")
            if "tmdb" in old_data:
                data["tmdb"] = old_data["tmdb"]
            
            for ep in data["episodes"]:
                for old_ep in old_data.get("episodes", []):
                    if ep["name"] == old_ep["name"]:
                        ep["overview"] = old_ep.get("overview", "")
                        ep["level"] = old_ep.get("level", "B2")
                        ep["dialogues"] = old_ep.get("dialogues", 0)
    except:
        pass

with open(out_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print(f"Created {out_path} with {len(eu_episodes)} episodes.")
