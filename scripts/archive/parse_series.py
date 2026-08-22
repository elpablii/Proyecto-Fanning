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

# 1. Queen's Gambit
qg_pdf = r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\Diálogos\Diálogos series\Dialogues from Queen's Gambit to improve the vocabulary in English.pdf"
qg_text = get_pdf_text(qg_pdf)

# Split by episode titles
# The titles are like "S01EP1: Openings", "S01EP2: Exchanges", etc.
episodes_splits = [
    ("S01EP1: Openings", "S01EP2: Exchanges"),
    ("S01EP2: Exchanges", "S01EP3: Doubled Pawns"),
    ("S01EP3: Doubled Pawns", "S01EP4: Middle Game"),
    ("S01EP4: Middle Game", "S01EP5: Fork"),
    ("S01EP5: Fork", "S01EP6: Adjournment"),
    ("S01EP6: Adjournment", "S01EP7: End Game"),
    ("S01EP7: End Game", None)
]

qg_counts = {}
for start_title, end_title in episodes_splits:
    start_idx = qg_text.find(start_title)
    if end_title:
        end_idx = qg_text.find(end_title)
        ep_text = qg_text[start_idx:end_idx]
    else:
        ep_text = qg_text[start_idx:]
    
    count = count_dialogues(ep_text)
    qg_counts[start_title] = count

# Special episode
qg_special_pdf = r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\Diálogos\Diálogos series\Dialogues from Creating Queen's Gambit to improve the vocabulary in English.pdf"
qg_special_text = get_pdf_text(qg_special_pdf)
qg_counts["Special: Creating Queen’s Gambit"] = count_dialogues(qg_special_text)

# Update manifest for Queen's Gambit
total_qg_dialogues = 0
for cat in ['2025', 'all']:
    for item in m[cat]['movieList']:
        if item['title'] == 'Gambito de Dama':
            if 'episodes' in item:
                for ep in item['episodes']:
                    # fix the apostrophe diff
                    ep_name = ep['name'].replace("’", "'").replace("", "'")
                    for k, v in qg_counts.items():
                        if ep_name == k.replace("’", "'").replace("", "'") or (ep_name.startswith("Special") and k.startswith("Special")):
                            ep['dialogues'] = v
                            total_qg_dialogues += v
            item['dialogues'] = total_qg_dialogues

# 2. Dream Productions
dp_pdf = r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\Diálogos\Diálogos series\Dialogues from Dream Productions to improve the vocabulary in English.pdf"
dp_text = get_pdf_text(dp_pdf)
dp_count = count_dialogues(dp_text)

for cat in ['2025', 'all']:
    for item in m[cat]['movieList']:
        if item['title'] == 'Dream Productions':
            item['dialogues'] = dp_count
            if 'episodes' in item and len(item['episodes']) > 0:
                item['episodes'][0]['dialogues'] = dp_count

json.dump(m, open(r'c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data\manifest.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)

print("Gambito de Dama Counts:", qg_counts)
print("Dream Productions Count:", dp_count)
print("Finished updating series!")
