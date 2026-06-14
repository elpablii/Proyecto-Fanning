import pypdf, json, re

m = json.load(open(r'c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data\manifest.json', encoding='utf-8'))

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

text1 = get_pdf_text(pdf1)
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

# Update manifest
total_dialogues = sum(counts.values())

for cat in ['2025', 'all']:
    for item in m[cat]['movieList']:
        if item['title'] == 'Euphoria':
            item['dialogues'] = total_dialogues
            if 'episodes' in item:
                for ep in item['episodes']:
                    # Extract the prefix like S01EP1 or Special 1
                    prefix = ep['name'].split(':')[0].strip()
                    if prefix == 'Special 1': prefix = 'Special Episode 1:'
                    if prefix == 'Special 2': prefix = 'Special Episode 2:'
                    if prefix in counts:
                        ep['dialogues'] = counts[prefix]

json.dump(m, open(r'c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data\manifest.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)

print("Euphoria Counts:")
for k, v in counts.items():
    print(f"{k}: {v}")
print(f"Total: {total_dialogues}")
print("Finished updating Euphoria!")
