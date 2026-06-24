import fitz
import json
import os

movies = [
    {
        "title": "Oppenheimer",
        "pdfs": [
            "../Vocabularios/2024/Palabras desconocidas de Oppenheimer (Parte 1 - lista definitiva).pdf",
            "../Vocabularios/2024/Palabras desconocidas de Oppenheimer (Parte 2 - lista definitiva).pdf"
        ],
        "englishAnalysis": "La película presenta un inglés americano culto y académico, ambientado en las décadas de 1930 a 1950. Utiliza mucho vocabulario científico y de física cuántica ('fission', 'isotope', 'uranium'), además de terminología militar y política ('clearance', 'communist', 'security'). Excelente para practicar inglés formal, debates éticos y vocabulario técnico avanzado."
    },
    {
        "title": "Taylor Swift The Eras Tour Film",
        "pdfs": [
            "../Vocabularios/2024/Palabras desconocidas de Taylor Swift The Eras Tour Film (Taylor's Version) (Parte 1 - lista definitiva).pdf",
            "../Vocabularios/2024/Palabras desconocidas de Taylor Swift The Eras Tour Film (Taylor's Version) (Parte 2 - lista definitiva).pdf"
        ],
        "englishAnalysis": "Muestra un inglés íntimo, musical y expresivo. Combina monólogos poéticos con el argot del mundo del espectáculo y de los fans ('eras', 'stadium', 'bridge', 'acoustic'). Es un lenguaje moderno y cercano, ideal para acostumbrarse al ritmo conversacional contemporáneo y expresiones idiomáticas de sentimientos."
    },
    {
        "title": "Titanic",
        "pdfs": [
            "../Vocabularios/2024/Palabras desconocidas de Titanic (Parte 1 - lista definitiva).pdf",
            "../Vocabularios/2024/Palabras desconocidas de Titanic (Parte 2 - lista definitiva).pdf"
        ],
        "englishAnalysis": "Contrasta vívidamente el inglés elegante y anticuado de la clase alta británica y estadounidense ('proprietor', 'steerage', 'honor') con el lenguaje coloquial e informal de la clase trabajadora ('bloke', 'mate', 'lad'). Incluye vocabulario náutico ('bow', 'stern', 'lifeboat')."
    },
    {
        "title": "Aves de Presa",
        "pdfs": [
            "../Vocabularios/2024/Palabras desconocidas de Aves de Presa (Parte 1 - lista definitiva).pdf",
            "../Vocabularios/2024/Palabras desconocidas de Aves de Presa (Parte 2 - lista definitiva).pdf"
        ],
        "englishAnalysis": "Presenta un inglés americano crudo, sarcástico y lleno de jerga callejera ('goon', 'mercenary', 'bounty', 'psycho'). El ritmo es frenético, con mucho humor negro y lenguaje explícito, excelente para exponerse al argot urbano moderno y expresiones criminales informales."
    },
    {
        "title": "Terminal",
        "pdfs": [
            "../Vocabularios/2024/Palabras desconocidas de Terminal (lista definitiva).pdf"
        ],
        "englishAnalysis": "Destaca por su estética noir y un uso del idioma poético, críptico y a menudo lleno de doble sentido. Los personajes utilizan metáforas oscuras, términos de asesinatos a sueldo e interrogatorios ('assassin', 'contract', 'job', 'leverage'). El acento británico le añade una capa de sofisticación al lenguaje criminal."
    }
]

os.makedirs('public/data/pelis', exist_ok=True)

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
