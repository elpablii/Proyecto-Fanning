import fitz
import json
import os

movies = [
    {
        "title": "Barbie La Princesa y Estrella de Pop",
        "pdfs": [
            "../Vocabularios/2024/Palabras desconocidas de Barbie La Princesa y Estrella de Pop (lista definitiva).pdf"
        ],
        "englishAnalysis": "Un inglés muy claro, juvenil y amigable, con lenguaje cotidiano moderno y mucho vocabulario musical y sobre amistad. Perfecto para niveles básicos e intermedios para agarrar confianza."
    },
    {
        "title": "Contrarreloj",
        "pdfs": [
            "../Vocabularios/2024/Palabras desconocidas de Contrarreloj (lista definitiva).pdf"
        ],
        "englishAnalysis": "Un thriller lleno de tensión con Liam Neeson. El inglés es asertivo, rápido y lleno de vocabulario relacionado con bombas, extorsiones policiales, vehículos y persecuciones. Ideal para practicar escucha bajo presión."
    },
    {
        "title": "Coraline",
        "pdfs": [
            "../Vocabularios/2024/Palabras desconocidas de Coraline (lista definitiva).pdf"
        ],
        "englishAnalysis": "Ofrece un inglés encantador pero inquietante. Destacan las estructuras curiosas, modismos ligeramente pasados de moda y el tono de fantasía oscura. Muy útil para vocabulario doméstico y descriptivo inusual."
    },
    {
        "title": "Harold and The Purple Crayon",
        "pdfs": [
            "../Vocabularios/2024/Palabras desconocidas de Harold and The Purple Crayon (lista definitiva).pdf"
        ],
        "englishAnalysis": "Lenguaje sumamente claro, imaginativo y accesible. Al estar orientado a un público familiar, el inglés es muy descriptivo y enfocado en colores, creatividad y emociones básicas."
    },
    {
        "title": "Intensamente",
        "pdfs": [
            "../Vocabularios/2024/Palabras desconocidas de Intensamente (lista definitiva).pdf"
        ],
        "englishAnalysis": "Una joya para aprender vocabulario emocional. El inglés es cotidiano, veloz y aborda directamente terminología sobre la mente humana, sentimientos abstractos (alegría, tristeza) y dinámicas familiares."
    },
    {
        "title": "Intensamente 2",
        "pdfs": [
            "../Vocabularios/2024/Palabras desconocidas de Intensamente 2 (lista definitiva).pdf"
        ],
        "englishAnalysis": "Sigue la línea de la primera parte pero introduce jerga adolescente y nuevas emociones más complejas (ansiedad, envidia, aburrimiento). El lenguaje refleja la pubertad, con expresiones típicas del instituto."
    },
    {
        "title": "Kim Possible (2019)",
        "pdfs": [
            "../Vocabularios/2024/Palabras desconocidas de Kim Possible (2019) (lista definitiva).pdf"
        ],
        "englishAnalysis": "Inglés adolescente moderno mezclado con terminología de espías y agentes secretos. Gran uso de jerga escolar ('drama', 'locker', 'cheerleader') y frases de acción tipo superhéroe."
    },
    {
        "title": "Marrowbone",
        "pdfs": [
            "../Vocabularios/2024/Palabras desconocidas de Marrowbone (lista definitiva).pdf"
        ],
        "englishAnalysis": "Un thriller psicológico de época. El inglés es rural y pausado, con un tono melancólico y vocabulario relacionado con el aislamiento, secretos familiares y suspenso clásico."
    },
    {
        "title": "Monsters Inc",
        "pdfs": [
            "../Vocabularios/2024/Palabras desconocidas de Monsters Inc (lista definitiva).pdf"
        ],
        "englishAnalysis": "Un clásico de Pixar. Presenta un inglés laboral/corporativo ('scare floor', 'quota', 'report') mezclado de forma magistral con humor de comedia física. Diálogos rápidos y sarcásticos."
    },
    {
        "title": "Olivia Rodrigo driving home 2 u",
        "pdfs": [
            "../Vocabularios/2024/Palabras desconocidas de Olivia Rodrigo driving home 2 u (lista definitiva).pdf"
        ],
        "englishAnalysis": "Inglés juvenil contemporáneo, muy documental e introspectivo. Está lleno de lenguaje emocional real sobre la composición musical, las presiones de la fama y reflexiones adolescentes."
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
