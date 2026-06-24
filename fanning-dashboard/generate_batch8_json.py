import fitz
import json
import os

movies = [
    {
        "title": "The Wolf of Wall Street",
        "pdfs": [
            "../Vocabularios/2025/Palabras desconocidas de The Wolf of Wall Street (Parte 1 - lista definitiva).pdf",
            "../Vocabularios/2025/Palabras desconocidas de The Wolf of Wall Street (Parte 2 - lista definitiva).pdf"
        ],
        "englishAnalysis": "Lenguaje extremadamente explícito, frenético y lleno de jerga financiera, excesos y vulgaridades. Ideal para acostumbrarse a la agresividad y el ritmo de las ventas en inglés americano, con diálogos verborreicos e insultos creativos."
    },
    {
        "title": "Rango",
        "pdfs": [
            "../Vocabularios/2025/Palabras desconocidas de Rango (Parte 1 - lista definitiva).pdf",
            "../Vocabularios/2025/Palabras desconocidas de Rango (Parte 2 - lista definitiva).pdf"
        ],
        "englishAnalysis": "Ofrece un vocabulario muy rico, casi teatral y filosófico, mezclado con jerga del Lejano Oeste y acentos desérticos arrastrados. Destacan los monólogos introspectivos y el uso de vocabulario arcaico y peculiar."
    },
    {
        "title": "Cars 2",
        "pdfs": [
            "../Vocabularios/2025/Palabras desconocidas de Cars II (Parte 1 - lista definitiva).pdf",
            "../Vocabularios/2025/Palabras desconocidas de Cars II (Parte 2 - lista definitiva).pdf"
        ],
        "englishAnalysis": "Inglés dinámico que combina el acento sureño y campechano ('redneck') de Mater con vocabulario internacional de espionaje, tácticas, armas secretas y expresiones británicas."
    },
    {
        "title": "Wonka",
        "pdfs": [
            "../Vocabularios/2025/Palabras desconocidas de Wonka (Parte 1 - lista definitiva).pdf",
            "../Vocabularios/2025/Palabras desconocidas de Wonka (Parte 2 - lista definitiva).pdf"
        ],
        "englishAnalysis": "Un inglés británico mágico y encantador. Lleno de vocabulario descriptivo relacionado con la confitería, los sueños y la imaginación. Diálogos excéntricos y pronunciación muy clara al estilo teatral."
    },
    {
        "title": "Emma",
        "pdfs": [
            "../Vocabularios/2025/Palabras desconocidas de Emma (lista definitiva).pdf"
        ],
        "englishAnalysis": "El summum del inglés aristocrático británico de la Regencia. Extremadamente formal, educado y lleno de sutilezas sociales, chismes corteses e ironía ('acquaintance', 'propriety', 'handsome')."
    },
    {
        "title": "Cars",
        "pdfs": [
            "../Vocabularios/2025/Palabras desconocidas de Cars I (lista definitiva).pdf"
        ],
        "englishAnalysis": "Perfecta contraposición entre el vocabulario acelerado, moderno y corporativo de las carreras ('rookie', 'sponsor') y el ritmo relajado, nostálgico y rural de los pueblos de la Ruta 66."
    },
    {
        "title": "Whiskey Tango Foxtrot",
        "pdfs": [
            "../Vocabularios/2025/Palabras desconocidas de Whiskey Tango Foxtrot (lista definitiva).pdf"
        ],
        "englishAnalysis": "Inglés periodístico y militar mezclado. Vocabulario de zonas de guerra, jerga de corresponsales, humor negro y términos geopolíticos y militares ('embedded', 'infidel', 'bureau')."
    },
    {
        "title": "Slaughterhouse Rulez",
        "pdfs": [
            "../Vocabularios/2025/Palabras desconocidas de Slaughterhouse Rulez (lista definitiva).pdf"
        ],
        "englishAnalysis": "Jerga juvenil británica moderna de internado ('posh' y popular) mezclada absurdamente con terminología de terror, monstruos y gore. Excelente para entender la irreverencia británica."
    },
    {
        "title": "The Menu",
        "pdfs": [
            "../Vocabularios/2025/Palabras desconocidas de The Menu (lista definitiva).pdf"
        ],
        "englishAnalysis": "El lenguaje es increíblemente pretencioso, refinado y tenso. Vocabulario de alta cocina ('palate', 'mouthfeel', 'courses'), críticas gastronómicas y una atmósfera de culto."
    },
    {
        "title": "Riesgo Bajo Cero",
        "pdfs": [
            "../Vocabularios/2025/Palabras desconocidas de Riesgo Bajo Cero (lista definitiva).pdf"
        ],
        "englishAnalysis": "Thiller de acción con lenguaje utilitario, técnico y centrado en la supervivencia. Vocabulario de maquinaria pesada, transporte de hielo, clima extremo y sabotajes."
    },
    {
        "title": "The Naked Gun",
        "pdfs": [
            "../Vocabularios/2025/Palabras desconocidas de The Naked Gun (lista definitiva).pdf"
        ],
        "englishAnalysis": "Inglés saturado de juegos de palabras, malentendidos ('puns') y humor absurdo. Parodia los tropos del cine negro policial con lenguaje rimbombante que se toma a sí mismo ridículamente en serio."
    },
    {
        "title": "Playmobil",
        "pdfs": [
            "../Vocabularios/2025/Palabras desconocidas de Playmobil (lista definitiva).pdf"
        ],
        "englishAnalysis": "Inglés familiar, infantil y de aventuras. Vocabulario muy accesible que viaja a través de diferentes escenarios (romanos, vikingos, espías), ideal para exposición a términos básicos variados."
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
