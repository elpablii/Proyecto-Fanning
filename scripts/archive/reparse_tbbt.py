import os
import pypdf
import json
import re

vocab_dir = r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\Vocabularios"
manifest_path = r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data\manifest.json"

tbbt_files = []
for root, dirs, files in os.walk(vocab_dir):
    for f in files:
        if f.lower().endswith('.pdf') and 'the big bang theory' in f.lower():
            tbbt_files.append(os.path.join(root, f))

tbbt_episodes = []

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
            if "unknown words" in line.lower() or "words/phrases" in line.lower() and not line.startswith("Episode"):
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
    
    current_season = season_prefix
    
    for line in lines:
        line = line.strip()
        if not line: continue
        if "unknown words" in line.lower() or "words/phrases" in line.lower() and not line.startswith("Episode"):
            continue
            
        # Detect new episode header
        match = re.match(r'(Episode\s+\d+:\s*.*?)\s*\(', line, re.IGNORECASE)
        if match:
            raw_title = match.group(1).strip()
            
            # Detect season crossover
            ep_num = int(re.search(r'Episode\s+(\d+)', raw_title, re.IGNORECASE).group(1))
            if current_season == "1" and ep_num < 17:
                # If we are in season 1 and suddenly see Episode 1, 2, 3 (The Bad Fish Paradigm, etc.)
                # and the filename has S02, we crossed over to season 2.
                # Let's just track if ep_num resets.
                pass 
                
            # Actually, let's just hardcode the titles for S02EP1-3 if they appear in S01
            if "Bad Fish Paradigm" in raw_title or "Codpiece Topology" in raw_title or "Barbarian Sublimation" in raw_title:
                current_season = "2"
                
            ep_title = f"S0{current_season}{raw_title.replace('Episode ', 'EP')}"
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

for pdf_path in tbbt_files:
    filename = os.path.basename(pdf_path)
    
    season = "1" if "S01" in filename else "2"
    parsed = parse_grouped_pdf(pdf_path, season)
    if not parsed:
        parsed = [{"name": filename.replace('.pdf', ''), "count": count_words_single(pdf_path)}]
    tbbt_episodes.extend(parsed)

# Sort
def sort_key(ep):
    name = ep["name"]
    if "S01EP" in name:
        num = int(re.search(r'EP(\d+)', name).group(1))
        return (1, num)
    elif "S02EP" in name:
        num = int(re.search(r'EP(\d+)', name).group(1))
        return (2, num)
    else:
        return (3, 0)

tbbt_episodes.sort(key=sort_key)

with open(manifest_path, 'r', encoding='utf-8') as f:
    manifest = json.load(f)

# The Big Bang Theory is only in 2025 and all
for cat in ["2025", "all"]:
    if cat not in manifest: continue
    for movie in manifest[cat].get("movieList", []):
        if movie["title"] == "The Big Bang Theory":
            movie["episodes"] = tbbt_episodes
            movie["count"] = sum(e["count"] for e in tbbt_episodes)
            print(f"Updated The Big Bang Theory in {cat} with {len(tbbt_episodes)} episodes.")

with open(manifest_path, 'w', encoding='utf-8') as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)

print("TBBT successfully reparsed!")
