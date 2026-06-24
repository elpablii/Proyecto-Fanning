import fitz
import json
import os

movies = [
    {
        "title": "Teen Spirit",
        "pdfs": [
            "../Vocabularios/2025/Palabras desconocidas de Teen Spirit (lista definitiva).pdf"
        ],
        "englishAnalysis": "En esta película protagonizada por Elle Fanning, se destaca el acento británico (particularmente el de la Isla de Wight) combinado con algo de vocabulario de la industria musical y los concursos de talentos. Es una buena oportunidad para acostumbrar el oído al acento inglés más rural y coloquial frente al estándar, además de captar la jerga juvenil de los aspirantes a cantantes."
    }
]

os.makedirs('public/data/pelis', exist_ok=True)

bad_prefixes = [
    "Unknown words",
    "Tour Film",
    "Palabras desconocidas",
    "Guión de la",
    "Guion de la",
    "Dialogues from"
]

for m in movies:
    vocab = []
    for pdf_path in m["pdfs"]:
        try:
            doc = fitz.open(pdf_path)
            text = ""
            for page in doc:
                text += page.get_text()
            
            lines = text.split('\n')
            for line in lines:
                line = line.strip()
                if ':' in line:
                    parts = line.split(':', 1)
                    word = parts[0].strip()
                    trans = parts[1].strip()
                    if word and trans and len(word) < 100:
                        is_bad = False
                        for bp in bad_prefixes:
                            if word.startswith(bp) or trans.startswith(bp):
                                is_bad = True
                                break
                        if not is_bad:
                            vocab.append({
                                "word": word,
                                "translation": trans
                            })
        except Exception as e:
            print(f"Error reading {pdf_path}: {e}")
            continue
    
    data = {
        "title": m["title"],
        "englishAnalysis": m["englishAnalysis"],
        "vocabulary": vocab
    }
    
    out_path = f"public/data/pelis/{m['title']}.json"
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    
    print(f"Generado {out_path} con {len(vocab)} palabras.")
