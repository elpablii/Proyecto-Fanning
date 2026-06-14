import pypdf, json, re

m = json.load(open(r'c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data\manifest.json', encoding='utf-8'))

def count_dialogues(pdf_path):
    print(f"Parsing: {pdf_path}")
    reader = pypdf.PdfReader(pdf_path)
    text = ''
    for p in reader.pages:
        text += p.extract_text() + '\n'
        
    count = len([1 for p in text.split('-->')[1:] if bool(re.search(r'[a-zA-Z]', p))])
    return count

g_count = count_dialogues(r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\Diálogos\Diálogos Series\Dialogues from Pan Am to improve the vocabulary in English.pdf")

updates = {
    "Pan Am": g_count
}

for cat in ['2026', 'all']:
    for item in m[cat]['movieList']:
        if item['title'] in updates:
            c = updates[item['title']]
            item['dialogues'] = c
            if 'episodes' in item and len(item['episodes']) > 0:
                item['episodes'][0]['dialogues'] = c

# Update yearlyData for 2026
for yd in m["yearlyData"]:
    if yd["year"] == "2026":
        yd["dialogues"] = sum(e.get("dialogues", 0) for e in m["2026"]["movieList"])

json.dump(m, open(r'c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data\manifest.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)

print("Updated Pan Am:", g_count)
print("Finished updating series!")
