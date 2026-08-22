import os
import pypdf
import json
import re

vocab_dir = r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\Vocabularios"
manifest_path = r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data\manifest.json"

kp_files = []
for root, dirs, files in os.walk(vocab_dir):
    for f in files:
        if f.lower().endswith('.pdf') and 'kim possible' in f.lower():
            kp_files.append(os.path.join(root, f))

kp_episodes_2024 = []
kp_episodes_2025 = []

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
        if "unknown words from" in line.lower() or "words/phrases" in line.lower() and not line.startswith("Episode"):
            # skip generic header
            continue
            
        # Detect new episode header
        # Example: "Episode 10: The Fearless Ferret (53 palabras/frases)"
        match = re.match(r'(Episode\s+\d+(?:-\d+|\s*&\s*\d+)?:\s*.*?)\s*\(', line, re.IGNORECASE)
        if match:
            ep_title = match.group(1).strip()
            
            # fix steal wheels
            if "Steal Wheels" in ep_title:
                ep_title = f"S03EP1: Steal Wheels"
            else:
                ep_title = f"S0{season_prefix}{ep_title.replace('Episode ', 'EP')}"
                
            current_ep = {"name": ep_title, "count": 0}
            episodes.append(current_ep)
        else:
            if current_ep:
                if ':' in line or ' - ' in line:
                    current_ep["count"] += 1
                else:
                    # if it looks like a word, let's count it
                    if len(line) < 40 and not "palabras/frases" in line:
                        current_ep["count"] += 1
                        
    return episodes

def count_words_single(pdf_path):
    word_count = 0
    reader = pypdf.PdfReader(pdf_path)
    title = ""
    for idx, page in enumerate(reader.pages):
        text = page.extract_text()
        if not text: continue
        
        # Try to extract title from first page
        if idx == 0:
            # We look for "episode X: Title - XX palabras" replacing newlines with spaces
            clean_text = text.replace('\n', ' ')
            m = re.search(r'episode\s+\d+:\s*(.*?)\s*[\-\–]\s*\d+\s*palabras', clean_text, re.IGNORECASE)
            if m:
                title = m.group(1).strip()
                
        lines = text.split('\n')
        for line in lines:
            line = line.strip()
            if not line: continue
            if "unknown words from" in line.lower() or "words/phrases" in line.lower() and not line.startswith("Episode"):
                continue
            if ':' in line or ' - ' in line or (len(line) < 40 and "palabras/frases" not in line):
                word_count += 1
    return word_count, title

for pdf_path in kp_files:
    filename = os.path.basename(pdf_path)
    year = "2024" if "2024" in pdf_path else "2025"
    
    eps_in_file = []
    
    if "So The Drama" in filename or "Todo un Drama" in filename:
        name = "Kim Possible: So the Drama (Película)"
        count, _ = count_words_single(pdf_path)
        eps_in_file.append({"name": name, "count": count})
    elif "2019" in filename:
        name = "Kim Possible (Película 2019)"
        count, _ = count_words_single(pdf_path)
        eps_in_file.append({"name": name, "count": count})
    elif "S02" in filename or "S03" in filename:
        season = "2" if "S02" in filename else "3"
        parsed = parse_grouped_pdf(pdf_path, season)
        if not parsed: # fallback
            count, _ = count_words_single(pdf_path)
            parsed = [{"name": filename.replace('.pdf', ''), "count": count}]
        eps_in_file.extend(parsed)
    else:
        # S01
        match = re.search(r'(S01EP\d+)', filename, re.IGNORECASE)
        base_name = match.group(1).upper() if match else filename.replace('.pdf', '')
        count, extracted_title = count_words_single(pdf_path)
        if extracted_title:
            name = f"{base_name}: {extracted_title}"
        else:
            name = base_name
        eps_in_file.append({"name": name, "count": count})
        
    if year == "2024":
        kp_episodes_2024.extend(eps_in_file)
    else:
        kp_episodes_2025.extend(eps_in_file)

# Sort S01, S02, S03, then movies
def sort_key(ep):
    name = ep["name"]
    if "S01EP" in name:
        num = int(re.search(r'EP(\d+)', name).group(1))
        return (1, num)
    elif "S02EP" in name:
        num_match = re.search(r'EP(\d+)', name)
        num = int(num_match.group(1)) if num_match else 0
        return (2, num)
    elif "S03EP" in name:
        num_match = re.search(r'EP(\d+)', name)
        num = int(num_match.group(1)) if num_match else 0
        return (3, num)
    else:
        return (4, 0)

kp_episodes_2024.sort(key=sort_key)
kp_episodes_2025.sort(key=sort_key)
kp_episodes_all = kp_episodes_2024 + kp_episodes_2025
kp_episodes_all.sort(key=sort_key)

with open(manifest_path, 'r', encoding='utf-8') as f:
    manifest = json.load(f)

for cat, ep_list in [("2024", kp_episodes_2024), ("2025", kp_episodes_2025), ("all", kp_episodes_all)]:
    for movie in manifest[cat].get("movieList", []):
        if movie["title"] == "Kim Possible":
            movie["episodes"] = ep_list
            movie["count"] = sum(e["count"] for e in ep_list)
            print(f"Updated Kim Possible in {cat} with {len(ep_list)} episodes.")

with open(manifest_path, 'w', encoding='utf-8') as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)

print("Kim Possible successfully reparsed!")
