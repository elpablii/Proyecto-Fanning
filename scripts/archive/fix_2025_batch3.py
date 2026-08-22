import pypdf, json, re

m = json.load(open(r'c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data\manifest.json', encoding='utf-8'))

def get_count(pdf):
    try:
        reader = pypdf.PdfReader(pdf)
        text = ''
        for p in reader.pages:
            text += p.extract_text() + '\n'
        return len([1 for p in text.split('-->')[1:] if bool(re.search(r'[a-zA-Z]', p))])
    except Exception as e:
        print(f"Failed to read {pdf}: {e}")
        return 0

updates = {
  'La Sustancia': r'c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\Diálogos\Diálogos pelis 2025\Dialogues from The Substance to improve the vocabulary in English.pdf',
  'Star Wars Episodio III Revenge of the Sith': r'c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\Diálogos\Diálogos pelis 2025\Dialogues from Star Wars Episode III Revenge of the Sith to improve the vocabulary in English.pdf',
  'Escape de Sobibor': r'c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\Diálogos\Diálogos pelis 2025\Dialogues from Escape from Sobibor to improve the vocabulary in English.pdf',
  'Star Wars Episodio VI Return of the Jedi': r'c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\Diálogos\Diálogos pelis 2025\Dialogues from Star Wars Episode VI Return of the Jedi to improve the vocabulary in English.pdf',
  'El Padrino I': r'c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\Diálogos\Diálogos pelis 2025\Dialogues from The Godfather I to improve the vocabulary in English.pdf'
}

for title, pdf in updates.items():
    c = get_count(pdf)
    print(f"{title}: {c}")
    for cat in ['2025', 'all']:
        for item in m[cat]['movieList']:
            if item['title'] == title:
                item['dialogues'] = c
                if 'episodes' in item and len(item['episodes']) > 0:
                    item['episodes'][0]['dialogues'] = c

for title in ['The Big Bang Theory', 'Euphoria', 'Gambito de Dama', 'Dream Productions']:
    for cat in ['2025', 'all']:
        for item in m[cat]['movieList']:
            if item['title'] == title:
                item['dialogues'] = 0
                if 'episodes' in item and len(item['episodes']) > 0:
                    item['episodes'][0]['dialogues'] = 0

json.dump(m, open(r'c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data\manifest.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
print("Finished!")
