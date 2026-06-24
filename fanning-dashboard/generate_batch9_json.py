import fitz
import json
import os

movies = [
    {
        "title": "Taylor Swift Folklore The Long Pond Studio Sessions",
        "pdfs": ["../Vocabularios/2025/Palabras desconocidas de Taylor Swift Folklore The Long Pond Studio Sessions (lista definitiva).pdf"],
        "englishAnalysis": "Inglés musical poético e introspectivo. Extremadamente conversacional, ideal para escuchar reflexiones en inglés sobre el proceso creativo con acento americano moderno y relajado."
    },
    {
        "title": "Dream Productions",
        "pdfs": ["../Vocabularios/2025/Palabras desconocidas de Dream Productions (de Intensamente) (lista definitiva).pdf"],
        "englishAnalysis": "Extensión del universo de Intensamente. Lenguaje veloz, caricaturesco y enfocado en dinámicas de estudio cinematográfico y emociones abstractas."
    },
    {
        "title": "Kim Possible Todo un Drama",
        "pdfs": ["../Vocabularios/2025/Palabras desconocidas de Kim Possible Todo un Drama (lista definitiva).pdf"],
        "englishAnalysis": "Animación adolescente de los 2000. Lenguaje rápido lleno de modismos adolescentes ('so not the drama', 'cheerleader') entrelazado con vocabulario clásico de agentes secretos y espionaje."
    },
    {
        "title": "Star Wars Episodio IV A New Hope",
        "pdfs": ["../Vocabularios/2025/Palabras desconocidas de Star Wars Episodio IV A New Hope (lista definitiva).pdf"],
        "englishAnalysis": "El clásico original. Mezcla acentos británicos (Imperiales) y americanos (Rebeldes). Lenguaje militar espacial, misticismo ('the Force') y dicción clara típica del cine de los 70."
    },
    {
        "title": "Los Fantasmas de Scrooge",
        "pdfs": ["../Vocabularios/2025/Palabras desconocidas de Los Fantasmas de Scrooge (lista definitiva).pdf"],
        "englishAnalysis": "Una excelente oportunidad para el inglés clásico británico de la época victoriana. Lenguaje rimbombante, arcaico a veces ('humbug', 'shilling', 'spectre') y muy rico en descripciones literarias."
    },
    {
        "title": "Buscando a Nemo",
        "pdfs": ["../Vocabularios/2025/Palabras desconocidas de Buscando a Nemo (lista definitiva).pdf"],
        "englishAnalysis": "Inglés familiar extremadamente claro y dinámico. Rico en juegos de palabras acuáticos, acentos californianos (tortugas surferas) y vocabulario sobre el océano y la crianza."
    },
    {
        "title": "Bichos Una Aventura en Miniatura",
        "pdfs": ["../Vocabularios/2025/Palabras desconocidas de Bichos Una Aventura en Miniatura (lista definitiva).pdf"],
        "englishAnalysis": "Inglés infantil de los años 90 con pronunciación muy nítida. Aborda vocabulario sobre la naturaleza, insectos, opresión y rebelión en un formato muy amigable y fácil de seguir."
    },
    {
        "title": "Toy Story III",
        "pdfs": ["../Vocabularios/2025/Palabras desconocidas de Toy Story III (lista definitiva).pdf"],
        "englishAnalysis": "Sigue el estándar alto de Pixar: inglés americano muy inteligible que combina vocabulario de preescolar con lenguaje dramático de escape de prisión. Ideal para escuchar matices de voz."
    },
    {
        "title": "Top Gun",
        "pdfs": ["../Vocabularios/2025/Palabras desconocidas de Top Gun (lista definitiva).pdf"],
        "englishAnalysis": "Inglés militar estadounidense de la Guerra Fría saturado de jerga de aviación ('bogey', 'mach', 'wingman') y mucha actitud. Acentos fuertes y lenguaje directo y asertivo bajo presión."
    },
    {
        "title": "Now is Good",
        "pdfs": ["../Vocabularios/2025/Palabras desconocidas de Now is Good (lista definitiva).pdf"],
        "englishAnalysis": "Drama juvenil británico. Excelente para acostumbrar el oído al acento inglés moderno, lenguaje coloquial de la juventud británica y vocabulario médico/emocional."
    },
    {
        "title": "Taylor Swift Reputation Stadium Tour",
        "pdfs": ["../Vocabularios/2025/Palabras desconocidas de Taylor Swift Reputation Stadium Tour (lista definitiva).pdf"],
        "englishAnalysis": "Inglés de estadio, con mucho eco. Ideal para practicar la comprensión de discursos ante multitudes ('crowd interaction'), y vocabulario musical sobre venganza, renacimiento y empoderamiento."
    },
    {
        "title": "Rocky III",
        "pdfs": ["../Vocabularios/2025/Palabras desconocidas de Rocky III (lista definitiva).pdf"],
        "englishAnalysis": "Sigue el clásico acento italoamericano arrastrado de Filadelfia. En esta entrega abunda el lenguaje deportivo rudo ('prediction: pain', 'chump', 'eye of the tiger') y la jerga de los 80."
    },
    {
        "title": "La Sustancia",
        "pdfs": ["../Vocabularios/2025/Palabras desconocidas de La Sustancia (lista definitiva).pdf"],
        "englishAnalysis": "Lenguaje corporativo, superficial y centrado en la belleza estética de Los Ángeles, contrastado con terminología médica cruda de ciencia ficción ('matrix', 'stabilize')."
    },
    {
        "title": "Alvin y las Ardillas",
        "pdfs": ["../Vocabularios/2025/Palabras desconocidas de Alvin y las Ardillas (lista definitiva).pdf"],
        "englishAnalysis": "Gran desafío auditivo por las voces agudas distorsionadas de las ardillas. Vocabulario de la industria musical, fama rápida y lenguaje cotidiano de la costa oeste americana."
    },
    {
        "title": "Star Wars Episodio III Revenge of the Sith",
        "pdfs": ["../Vocabularios/2025/Palabras desconocidas de Star Wars Episodio III Revenge of the Sith (lista definitiva).pdf"],
        "englishAnalysis": "El punto álgido del lenguaje diplomático, trágico y oscuro de las precuelas. Diálogos casi shakesperianos ('treason', 'absolutes', 'democracy') y confrontaciones intensas."
    },
    {
        "title": "Last Night in Soho",
        "pdfs": ["../Vocabularios/2025/Palabras desconocidas de Last Night in Soho (lista definitiva).pdf"],
        "englishAnalysis": "Thriller psicológico perfecto para comparar el inglés londinense contemporáneo de una estudiante de moda, contra el acento callejero y el argot del bajo mundo londinense de los vibrantes años 60."
    },
    {
        "title": "Escape de Sobibor",
        "pdfs": ["../Vocabularios/2025/Palabras desconocidas de Escape de Sobibor (lista definitiva).pdf"],
        "englishAnalysis": "Drama bélico duro ambientado en la Segunda Guerra Mundial. Acentos eslavos y alemanes fuertemente fingidos hablando en inglés. Vocabulario carcelario, militar y de supervivencia cruda."
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
        if not os.path.exists(pdf_path):
            print(f"Warning: File not found {pdf_path}")
            continue
            
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
    
    if len(vocab) > 0:
        data = {
            "title": m["title"],
            "englishAnalysis": m["englishAnalysis"],
            "vocabulary": vocab
        }
        
        out_path = f"public/data/pelis/{m['title']}.json"
        
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"Generado {out_path} con {len(vocab)} palabras.")
    else:
        print(f"Skipping {m['title']} - no vocabulary found.")
