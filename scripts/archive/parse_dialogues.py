import os
import glob
import pypdf
import json
import re

dialogues_dir = r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\Diálogos"
manifest_path = r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data\manifest.json"

def has_letters(text):
    return bool(re.search(r'[a-zA-Z]', text))

def extract_movie_dialogues(pdf_path):
    print(f"Parsing movie PDF: {pdf_path}")
    count = 0
    try:
        reader = pypdf.PdfReader(pdf_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
            
        parts = text.split('-->')
        # parts[0] is everything before the first --> (so no dialogue)
        # parts[1:] contain the dialogue
        for part in parts[1:]:
            if has_letters(part):
                count += 1
    except Exception as e:
        print(f"Error parsing {pdf_path}: {e}")
    return count

def parse_series_dialogues(pdf_paths):
    episodes_counts = {}
    
    for pdf_path in pdf_paths:
        print(f"Parsing series PDF: {pdf_path}")
        try:
            reader = pypdf.PdfReader(pdf_path)
            text = ""
            for page in reader.pages:
                text += page.extract_text() + "\n"
                
            parts = text.split('-->')
            current_ep = "Unknown"
            
            # Check for header in part 0 (before first dialogue)
            m = re.search(r'(S\d+EP\d+:.*?|Episode\s+\d+:.*?|Special.*?Episode:.*?)\n', parts[0], re.IGNORECASE)
            if m:
                current_ep = m.group(1).strip()
                
            for part in parts[1:]:
                # The dialogue in this 'part' belongs to 'current_ep'
                if has_letters(part):
                    if current_ep not in episodes_counts:
                        episodes_counts[current_ep] = 0
                    episodes_counts[current_ep] += 1
                
                # Check if this part contains a header for the NEXT episode
                m = re.search(r'(S\d+EP\d+:.*?|Episode\s+\d+:.*?|Special.*?Episode:.*?)\n', part, re.IGNORECASE)
                if m:
                    current_ep = m.group(1).strip()
                        
        except Exception as e:
            print(f"Error parsing {pdf_path}: {e}")
            
    return episodes_counts

# Load manifest
with open(manifest_path, 'r', encoding='utf-8') as f:
    manifest = json.load(f)

# Collect all movie PDFs
movie_pdfs = glob.glob(os.path.join(dialogues_dir, "Diálogos pelis *", "*.pdf"))
# Collect all series PDFs
series_pdfs = glob.glob(os.path.join(dialogues_dir, "Diálogos Series", "*.pdf"))

# We'll map movie titles to their PDF paths heuristically
movie_dialogues_cache = {}
for pdf in movie_pdfs:
    filename = os.path.basename(pdf).lower()
    movie_dialogues_cache[filename] = extract_movie_dialogues(pdf)

def find_movie_dialogue_count(title):
    title_lower = title.lower()
    for filename, count in movie_dialogues_cache.items():
        if title_lower in filename:
            return count
    return 0

# For series, group PDFs by series title
series_dialogues_cache = {} 
for series_title in ["Kim Possible", "Euphoria", "The Big Bang Theory", "Gambito de Dama", "Dream Productions"]:
    matching_pdfs = [p for p in series_pdfs if series_title.lower() in os.path.basename(p).lower() or ("queen's gambit" in os.path.basename(p).lower() and series_title == "Gambito de Dama")]
    if matching_pdfs:
        series_dialogues_cache[series_title] = parse_series_dialogues(matching_pdfs)

def normalize_ep_name(ep_name):
    # Try to match names like "S01EP1: Pilot"
    ep_name = ep_name.lower().replace("episode", "ep")
    return ep_name

def fuzzy_match_ep(manifest_ep_name, series_counts_dict):
    m_name = normalize_ep_name(manifest_ep_name)
    # Direct match
    for k, v in series_counts_dict.items():
        if normalize_ep_name(k) in m_name or m_name in normalize_ep_name(k):
            return v
    # Try just the SXXEPXX part
    match = re.search(r'(s\d+ep\d+)', m_name)
    if match:
        key = match.group(1)
        for k, v in series_counts_dict.items():
            if key in normalize_ep_name(k):
                return v
    return 0

# Update manifest
for cat_name, cat_data in manifest.items():
    if "movieList" not in cat_data: continue
    
    for item in cat_data["movieList"]:
        if "episodes" in item and len(item["episodes"]) > 0:
            # It's a series
            title = item["title"]
            total_dialogues = 0
            series_dict = series_dialogues_cache.get(title, {})
            
            for ep in item["episodes"]:
                ep_dialogues = fuzzy_match_ep(ep["name"], series_dict)
                ep["dialogues"] = ep_dialogues
                total_dialogues += ep_dialogues
            
            item["dialogues"] = total_dialogues
        else:
            # It's a movie
            count = find_movie_dialogue_count(item["title"])
            item["dialogues"] = count

with open(manifest_path, 'w', encoding='utf-8') as f:
    json.dump(manifest, f, ensure_ascii=False, indent=2)

print("Dialogues successfully parsed and added to manifest!")
