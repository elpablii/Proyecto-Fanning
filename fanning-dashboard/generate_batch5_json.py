import fitz
import json
import os

movies = [
    {
        "title": "Ratatouille",
        "pdfs": [
            "../Vocabularios/2024/Palabras desconocidas de Ratatouille (lista definitiva).pdf"
        ],
        "englishAnalysis": "Una película de Pixar que, aunque animada, ofrece un inglés rico, fluido y lleno de vocabulario culinario. Encontrarás palabras como 'recipe', 'flavor', 'chef', mezcladas con un encantador acento francés falso que le da un toque único. Excelente para familiarizarse con vocabulario de cocina."
    },
    {
        "title": "Scarface",
        "pdfs": [
            "../Vocabularios/2024/Palabras desconocidas de Scarface (lista definitiva).pdf"
        ],
        "englishAnalysis": "Un clásico del cine criminal de los años 80. El lenguaje es extremadamente explícito, agresivo y dominado por el denso acento cubano-americano de Tony Montana. Abunda la jerga criminal, los insultos creativos y expresiones de poder. No apta para oídos sensibles, pero excelente para captar acentos fuertes."
    },
    {
        "title": "Five Nights at Freddy's",
        "pdfs": [
            "../Vocabularios/2024/Palabras desconocidas de Five Nights at Freddy's (lista definitiva).pdf"
        ],
        "englishAnalysis": "Ofrece un inglés moderno e informal. Encontrarás vocabulario técnico relacionado con la seguridad, animatrónicos y jerga adolescente de los años 2000. El tono varía entre conversaciones familiares cotidianas y momentos de gran tensión y suspenso."
    },
    {
        "title": "Toy Story 2",
        "pdfs": [
            "../Vocabularios/2024/Palabras desconocidas de Toy Story 2 (lista definitiva).pdf"
        ],
        "englishAnalysis": "Un inglés americano muy claro y fácil de seguir, ideal para nivel intermedio. Combina lenguaje cotidiano ('garage sale', 'collector') con terminología espacial ('galaxy', 'laser') y del viejo oeste ('sheriff', 'prospector'). Los diálogos son rápidos pero perfectamente articulados."
    },
    {
        "title": "Star Wars Episodio I The Phantom Menace",
        "pdfs": [
            "../Vocabularios/2024/Palabras desconocidas de Star Wars Episodio I The Phantom Menace (lista definitiva).pdf"
        ],
        "englishAnalysis": "Llena de terminología política, diplomática y de ciencia ficción ('senate', 'treaty', 'Jedi', 'force'). El lenguaje formal y solemne de los Jedi contrasta con los diversos dialectos alienígenas (como el de Jar Jar Binks, que es un reto de comprensión). Mezcla acentos británicos y americanos."
    },
    {
        "title": "The Legend of Tarzan",
        "pdfs": [
            "../Vocabularios/2024/Palabras desconocidas de The Legend of Tarzan (lista definitiva).pdf"
        ],
        "englishAnalysis": "Ofrece una interesante dicotomía: por un lado, el inglés aristocrático británico de la Inglaterra victoriana ('lord', 'civilized', 'estate'); por otro, un lenguaje más crudo, primitivo y táctico relacionado con la supervivencia y el imperialismo en la selva africana."
    },
    {
        "title": "Rambo First Blood",
        "pdfs": [
            "../Vocabularios/2024/Palabras desconocidas de Rambo First Blood (lista definitiva).pdf"
        ],
        "englishAnalysis": "El lenguaje es parco, tenso y muy directo. Destaca la jerga policial de pueblo pequeño ('sheriff', 'drifter', 'backup') combinada con fuerte terminología militar de la guerra de Vietnam ('guerrilla', 'POW', 'casualty'). Perfecto para practicar comprensión en situaciones de alta presión."
    },
    {
        "title": "Dreamland",
        "pdfs": [
            "../Vocabularios/2024/Palabras desconocidas de Dreamland (lista definitiva).pdf"
        ],
        "englishAnalysis": "Ambientada en la época de la Gran Depresión estadounidense. El inglés tiene un fuerte tinte rural, con acentos del medio oeste y Texas. Encontrarás vocabulario relacionado con la pobreza, el polvo ('dust bowl'), los robos a bancos y la supervivencia desesperada."
    },
    {
        "title": "Venganza Implacable",
        "pdfs": [
            "../Vocabularios/2024/Palabras desconocidas de Venganza Implacable (lista definitiva).pdf"
        ],
        "englishAnalysis": "Un thriller de acción moderno protagonizado por Liam Neeson. El inglés es funcional, asertivo y lleno de jerga criminal y policial contemporánea ('feds', 'wire', 'safe house'). Las frases son cortas e imperativas, ideales para aprender a dar órdenes y comprender amenazas sutiles."
    },
    {
        "title": "Toy Story",
        "pdfs": [
            "../Vocabularios/2024/Palabras desconocidas de Toy Story (lista definitiva).pdf"
        ],
        "englishAnalysis": "La película que lo inició todo. Ofrece un inglés sumamente accesible y amigable. Es perfecto para captar vocabulario del hogar, la habitación de un niño y juegos infantiles. La claridad en la dicción de los actores de voz (Tom Hanks y Tim Allen) la hace ideal para entrenar el oído de forma relajada."
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
