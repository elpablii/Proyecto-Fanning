import fitz
import json
import os

movies = [
    {
        "title": "Suite Francaise",
        "pdfs": ["../Vocabularios/2024/Palabras desconocidas de Suite Francaise (lista definitiva).pdf"],
        "englishAnalysis": "Ambientada en la Segunda Guerra Mundial, presenta un inglés británico y europeo formal de la década de 1940. El lenguaje es pulcro, contenido y lleno de sutilezas emocionales y vocabulario bélico/doméstico."
    },
    {
        "title": "The Truman Show",
        "pdfs": ["../Vocabularios/2024/Palabras desconocidas de The Truman Show (lista definitiva).pdf"],
        "englishAnalysis": "Una cápsula del tiempo del idílico y prefabricado inglés americano de los suburbios de los años 90. Diálogos exageradamente amables, vocabulario de vecindario y expresiones de publicidad encubierta. Excelente para el inglés 'perfecto' y cotidiano."
    },
    {
        "title": "Z for Zachariah",
        "pdfs": ["../Vocabularios/2024/Palabras desconocidas de Z for Zachariah (lista definitiva).pdf"],
        "englishAnalysis": "Drama post-apocalíptico con pocos personajes. El inglés es tenso, pausado y con un fuerte acento rural del sur profundo de EE.UU. Vocabulario centrado en la supervivencia, la religión y el trabajo agrícola."
    },
    {
        "title": "Taylor Swift City of Lover Concert",
        "pdfs": ["../Vocabularios/2024/Palabras desconocidas de Taylor Swift City of Lover Concert (lista definitiva).pdf"],
        "englishAnalysis": "Inglés conversacional contemporáneo de la artista dirigiéndose a su público entre canciones, mezclado con vocabulario poético y emocional de sus letras. Excelente para practicar la escucha de acentos americanos jóvenes y discursos casuales."
    },
    {
        "title": "Star Wars Episodio II Attack of The Clones",
        "pdfs": ["../Vocabularios/2024/Palabras desconocidas de Star Wars Episodio II Attack of The Clones (lista definitiva).pdf"],
        "englishAnalysis": "Lenguaje de ciencia ficción mezclado con política y romance cortés. Diálogos formales y a veces rígidos ('Jedi', 'Republic', 'senator'), con diversos acentos alienígenas y británicos."
    },
    {
        "title": "WALL-E",
        "pdfs": ["../Vocabularios/2024/Palabras desconocidas de WALL-E (lista definitiva).pdf"],
        "englishAnalysis": "Aunque tiene muy poco diálogo al principio, el vocabulario posterior se centra en corporativismo exagerado, automatización y consumismo ('directive', 'auto-pilot', 'plant'). Voces de robots y acentos americanos muy estandarizados."
    },
    {
        "title": "Rambo II",
        "pdfs": ["../Vocabularios/2024/Palabras desconocidas de Rambo II (lista definitiva).pdf"],
        "englishAnalysis": "Inglés militar táctico de los años 80, muy similar a la primera parte pero más enfocado en el combate activo. Expresiones cortas, jerga de armamento, supervivencia en la selva y acentos eslavos/asiáticos fingidos."
    },
    {
        "title": "The New Mutants",
        "pdfs": ["../Vocabularios/2024/Palabras desconocidas de The New Mutants (lista definitiva).pdf"],
        "englishAnalysis": "Una mezcla única: inglés adolescente moderno (con su respectiva jerga y rebeldía) dentro del contexto de un thriller sobrenatural y un entorno psiquiátrico ('facility', 'mutant', 'powers')."
    },
    {
        "title": "Rambo IV",
        "pdfs": ["../Vocabularios/2024/Palabras desconocidas de Rambo IV (John Rambo) (lista definitiva).pdf"],
        "englishAnalysis": "Lenguaje extremadamente crudo, parco y violento. Diálogos muy breves, vocabulario relacionado con mercenarios, genocidio, tácticas de guerra modernas y armamento pesado."
    },
    {
        "title": "Rambo Last Blood",
        "pdfs": ["../Vocabularios/2024/Palabras desconocidas de Rambo Last Blood (lista definitiva).pdf"],
        "englishAnalysis": "Una evolución del personaje hacia un entorno de rancho y carteles fronterizos. Mezcla de inglés texano/fronterizo, Spanglish ('cartel', 'border', 'tunnels') y el clásico lenguaje táctico y de venganza."
    },
    {
        "title": "Rambo III",
        "pdfs": ["../Vocabularios/2024/Palabras desconocidas de Rambo III (lista definitiva).pdf"],
        "englishAnalysis": "Inglés bélico ambientado en Afganistán durante la Guerra Fría. Vocabulario de tácticas de guerrilla, combate desértico e intervencionismo militar, con acentos rusos y de Oriente Medio de los años 80."
    },
    {
        "title": "Kim Possible (Película 2019)",
        "pdfs": ["../Vocabularios/2024/Palabras desconocidas de Kim Possible (2019) (lista definitiva).pdf"],
        "englishAnalysis": "Inglés adolescente moderno mezclado con terminología de espías y agentes secretos. Gran uso de jerga escolar ('drama', 'locker', 'cheerleader') y frases de acción tipo superhéroe."
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
        
        # Guardar una versión extra con el carácter corrupto por si acaso el frontend no lo maneja bien
        if "Película" in m["title"]:
            corrupt_path = f"public/data/pelis/Kim Possible (Pelcula 2019).json"
            with open(corrupt_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            print(f"Generado {corrupt_path} con {len(vocab)} palabras.")

        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"Generado {out_path} con {len(vocab)} palabras.")
    else:
        print(f"Skipping {m['title']} - no vocabulary found.")
