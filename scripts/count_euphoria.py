import pypdf, json, re

json_path = r'c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data\pelis\Euphoria.json'
with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

def count_dialogues(text):
    return len([1 for p in text.split('-->')[1:] if bool(re.search(r'[a-zA-Z]', p))])

def get_pdf_text(pdf_path):
    reader = pypdf.PdfReader(pdf_path)
    text = ''
    for p in reader.pages:
        text += p.extract_text() + '\n'
    return text

pdf1 = r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\Diálogos\Diálogos series\Dialogues from Euphoria in English (Season 1 + Special Episodes).pdf"
pdf2 = r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\Diálogos\Diálogos series\Dialogues from Euphoria in English (Season 2).pdf"

print("Reading PDF 1...")
text1 = get_pdf_text(pdf1)
print("Reading PDF 2...")
text2 = get_pdf_text(pdf2)

# Season 1 and Specials splits
episodes_splits_1 = [
    ("S01EP1", "S01EP2"),
    ("S01EP2", "S01EP3"),
    ("S01EP3", "S01EP4"),
    ("S01EP4", "S01EP5"),
    ("S01EP5", "S01EP6"),
    ("S01EP6", "S01EP7"),
    ("S01EP7", "S01EP8"),
    ("S01EP8", "Special Episode 1:"),
    ("Special Episode 1:", "Special Episode 2:"),
    ("Special Episode 2:", None)
]

# Season 2 splits
episodes_splits_2 = [
    ("S02EP1", "S02EP2"),
    ("S02EP2", "S02EP3"),
    ("S02EP3", "S02EP4"),
    ("S02EP4", "S02EP5"),
    ("S02EP5", "S02EP6"),
    ("S02EP6", "S02EP7"),
    ("S02EP7", "S02EP8"),
    ("S02EP8", None)
]

counts = {}

def process_splits(text, splits):
    for start_key, end_key in splits:
        start_idx = text.find(start_key)
        if start_idx == -1:
            print(f"Warning: {start_key} not found in PDF!")
            continue
            
        if end_key:
            end_idx = text.find(end_key)
            if end_idx == -1:
                print(f"Warning: {end_key} not found, reading to end!")
                ep_text = text[start_idx:]
            else:
                ep_text = text[start_idx:end_idx]
        else:
            ep_text = text[start_idx:]
        
        counts[start_key] = count_dialogues(ep_text)

process_splits(text1, episodes_splits_1)
process_splits(text2, episodes_splits_2)

# Map back to new naming scheme: S01E01 instead of S01EP1
# Special Episode 1: -> Special 1

for ep in data['episodes']:
    name = ep['name'] # e.g. S01E01 - Pilot
    
    if "Special 1" in name:
        match_key = "Special Episode 1:"
    elif "Special 2" in name:
        match_key = "Special Episode 2:"
    elif "S01E" in name:
        num = int(re.search(r'E(\d+)', name).group(1))
        match_key = f"S01EP{num}"
    elif "S02E" in name:
        num = int(re.search(r'E(\d+)', name).group(1))
        match_key = f"S02EP{num}"
    else:
        match_key = None
        
    if match_key and match_key in counts:
        ep['dialogues'] = counts[match_key]
        print(f"Matched {name} -> {counts[match_key]} dialogues")

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Updated Euphoria JSON with dialogue counts.")
