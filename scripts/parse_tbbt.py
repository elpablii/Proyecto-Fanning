import pypdf, json, re

m = json.load(open(r'c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data\manifest.json', encoding='utf-8'))

def count_dialogues(text):
    return len([1 for p in text.split('-->')[1:] if bool(re.search(r'[a-zA-Z]', p))])

def get_pdf_text(pdf_path):
    print(f"Reading {pdf_path}...")
    reader = pypdf.PdfReader(pdf_path)
    text = ''
    for p in reader.pages:
        text += p.extract_text() + '\n'
    return text

pdf_paths = [
    r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\Diálogos\Diálogos series\Dialogues from The Big Bang Theory in English (Season 1).pdf",
    r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\Diálogos\Diálogos series\Dialogues from The Big Bang Theory in English (Season 2).pdf",
    r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\Diálogos\Diálogos series\Dialogues from The Big Bang Theory in English (Season 3).pdf",
    r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\Diálogos\Diálogos series\Dialogues from The Big Bang Theory in English (Season 4).pdf",
    r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\Diálogos\Diálogos series\Dialogues from The Big Bang Theory in English (Season 5).pdf"
]

# We need the splits for each season
season_episodes = {
    1: 17,
    2: 23,
    3: 23,
    4: 24,
    5: 24
}

counts = {}

for season in range(1, 6):
    text = get_pdf_text(pdf_paths[season-1])
    max_ep = season_episodes[season]
    
    splits = [(f"S{season:02d}EP{i}", f"S{season:02d}EP{i+1}") for i in range(1, max_ep)] + [(f"S{season:02d}EP{max_ep}", None)]
    
    for start_key, end_key in splits:
        start_idx = text.find(start_key)
        if start_idx == -1:
            # Fallback for S05EP01 if they added leading zero
            start_key_alt = f"S{season:02d}EP{int(start_key.split('EP')[1]):02d}"
            start_idx = text.find(start_key_alt)
            if start_idx == -1:
                print(f"Warning: {start_key} not found in PDF!")
                continue
            
        if end_key:
            end_idx = text.find(end_key)
            if end_idx == -1:
                end_key_alt = f"S{season:02d}EP{int(end_key.split('EP')[1]):02d}"
                end_idx = text.find(end_key_alt)
                if end_idx == -1:
                    ep_text = text[start_idx:]
                else:
                    ep_text = text[start_idx:end_idx]
            else:
                ep_text = text[start_idx:end_idx]
        else:
            ep_text = text[start_idx:]
        
        counts[start_key] = count_dialogues(ep_text)

# Update manifest
total_dialogues = sum(counts.values())
print(f"Total dialogues across all S1-S5: {total_dialogues}")

def get_grouped_count(ep_name):
    prefix_match = re.match(r'(S\d+EP)(\d+)-(\d+)', ep_name)
    if prefix_match:
        base = prefix_match.group(1)
        start = int(prefix_match.group(2))
        end = int(prefix_match.group(3))
        
        total = 0
        for i in range(start, end + 1):
            key = f"{base}{i}"
            total += counts.get(key, 0)
        return total
    else:
        # Match single episode
        prefix = ep_name.split(':')[0].strip()
        return counts.get(prefix, 0)

for cat in ['2024', '2025', '2026', 'all']:
    if cat not in m: continue
    for item in m[cat].get('movieList', []):
        if item['title'] == 'The Big Bang Theory':
            if 'episodes' in item:
                # the total dialogues for this specific year/category is the sum of its episodes
                cat_total = 0
                for ep in item['episodes']:
                    c = get_grouped_count(ep['name'])
                    ep['dialogues'] = c
                    cat_total += c
                item['dialogues'] = cat_total

json.dump(m, open(r'c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data\manifest.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)

print("Finished updating The Big Bang Theory S1-S5!")
