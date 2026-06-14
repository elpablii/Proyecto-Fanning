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

pdf1 = r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\Diálogos\Diálogos series\Dialogues of Kim Possible in English (Season 1).pdf"
pdf2 = r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\Diálogos\Diálogos series\Dialogues of Kim Possible in English (Season 2).pdf"
pdf3 = r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\Diálogos\Diálogos series\Dialogues of Kim Possible in English (Season 3).pdf"
pdf4 = r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\Diálogos\Diálogos series\Dialogues of Kim Possible in English (Season 4).pdf"

print("Reading PDFs...")
text1 = get_pdf_text(pdf1)
text2 = get_pdf_text(pdf2)
text3 = get_pdf_text(pdf3)
text4 = get_pdf_text(pdf4)

counts = {}

def get_ep_count(text, start_key, end_key):
    start_idx = text.find(start_key)
    if start_idx == -1:
        print(f"NOT FOUND: {start_key}")
        return 0
    if end_key:
        end_idx = text.find(end_key)
        if end_idx == -1:
            print(f"NOT FOUND END: {end_key}")
            return count_dialogues(text[start_idx:])
        return count_dialogues(text[start_idx:end_idx])
    return count_dialogues(text[start_idx:])

print("Processing S1...")
s1_keys = [f"S01EP{i:02d}" for i in range(1, 22)]
for i in range(len(s1_keys)-1):
    counts[s1_keys[i]] = get_ep_count(text1, s1_keys[i], s1_keys[i+1])
counts[s1_keys[-1]] = get_ep_count(text1, s1_keys[-1], None)

print("Processing S2...")
s2_keys = ["S02EP1"] + [f"S02EP{i:02d}" for i in range(2, 31)]
s2_keys[5] = "S02EP06A"
s2_keys[11] = "S02EP12A"
s2_keys[24] = "S02EP25A"

for i in range(len(s2_keys)-1):
    count = get_ep_count(text2, s2_keys[i], s2_keys[i+1])
    key = s2_keys[i].replace('A', '') # map back to S02EP06 etc
    counts[key] = count
counts[s2_keys[-1]] = get_ep_count(text2, s2_keys[-1], None)

print("Processing S3...")
s3_keys = [f"S03EP{i:02d}" for i in range(1, 12)] + ["Kim Possible: So the Drama"]
for i in range(len(s3_keys)-1):
    counts[s3_keys[i]] = get_ep_count(text3, s3_keys[i], s3_keys[i+1])
counts[s3_keys[-1]] = get_ep_count(text3, s3_keys[-1], None)

print("Processing S4...")
s4_keys = [f"S04EP{i:02d}" for i in range(1, 23)]
for i in range(len(s4_keys)-1):
    counts[s4_keys[i]] = get_ep_count(text4, s4_keys[i], s4_keys[i+1])
counts[s4_keys[-1]] = get_ep_count(text4, s4_keys[-1], None)


# Map S02EP1 to S02EP01 for consistency if needed, wait S02EP1 is fine, we'll map both.
counts["S02EP01"] = counts["S02EP1"]

# Update manifest
print("Updating manifest...")
for cat in ['2024', '2025', '2026', 'all']:
    if cat not in m: continue
    for item in m[cat].get('movieList', []):
        if item['title'] == 'Kim Possible':
            if 'episodes' in item:
                for ep in item['episodes']:
                    name = ep['name']
                    if name.startswith("Kim Possible: So the Drama"):
                        if "Kim Possible: So the Drama" in counts:
                            ep['dialogues'] = counts["Kim Possible: So the Drama"]
                    else:
                        prefix = name.split(':')[0].strip()
                        
                        # manifest has S01EP1 format. Map to S01EP01 format.
                        try:
                            ep_num = int(prefix.split('EP')[1])
                            prefix_padded = f"{prefix.split('EP')[0]}EP{ep_num:02d}"
                        except:
                            prefix_padded = prefix
                        
                        if prefix_padded in counts:
                            ep['dialogues'] = counts[prefix_padded]
                        elif prefix in counts:
                            ep['dialogues'] = counts[prefix]
            
            # Recalculate total for this chunk
            if 'episodes' in item:
                item['dialogues'] = sum(ep.get('dialogues', 0) for ep in item['episodes'])

json.dump(m, open(r'c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data\manifest.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)

print("Kim Possible Counts:")
for k, v in counts.items():
    print(f"{k}: {v}")
print("Finished updating Kim Possible!")
