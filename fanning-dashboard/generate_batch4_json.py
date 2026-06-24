import fitz
import json
import os

movies = [
    {
        "title": "Babylon",
        "pdfs": [
            "../Vocabularios/2024/Palabras desconocidas de Babylon (lista definitiva).pdf"
        ],
        "englishAnalysis": "Ambientada en los años 20 durante la transición del cine mudo al sonoro, el lenguaje de esta película es frenético, crudo y lleno de excesos. Abunda la jerga de la industria cinematográfica temprana, expresiones de asombro y desesperación, y un ritmo de diálogo extremadamente rápido que pondrá a prueba tu comprensión auditiva en situaciones caóticas."
    },
    {
        "title": "Goodbye Christopher Robin",
        "pdfs": [
            "../Vocabularios/2024/Palabras desconocidas de Goodbye Christopher Robin (lista definitiva).pdf"
        ],
        "englishAnalysis": "Una película británica con un inglés elegante, formal y nostálgico. Ideal para sumergirse en acentos de clase alta de principios del siglo XX ('RP' o Received Pronunciation), vocabulario relacionado con la literatura, la infancia y las secuelas psicológicas de la guerra."
    },
    {
        "title": "About Time",
        "pdfs": [
            "../Vocabularios/2024/Palabras desconocidas de About Time (lista definitiva).pdf"
        ],
        "englishAnalysis": "Ofrece una inmersión perfecta en el inglés conversacional británico contemporáneo. Llena de humor sutil, expresiones cotidianas ('mate', 'bloody', 'lovely') y situaciones familiares. Excelente para practicar la comprensión de acentos de diferentes regiones del Reino Unido en un entorno relajado."
    },
    {
        "title": "Rocky II",
        "pdfs": [
            "../Vocabularios/2024/Palabras desconocidas de Rocky II (lista definitiva).pdf"
        ],
        "englishAnalysis": "El inglés de Rocky es muy representativo del acento de clase trabajadora de Filadelfia. Caracterizado por oraciones cortas, pronunciación arrastrada y vocabulario directo. Abunda la jerga de boxeo ('heavyweight', 'southpaw', 'jab') y expresiones motivacionales crudas."
    },
    {
        "title": "I-Tonya",
        "pdfs": [
            "../Vocabularios/2024/Palabras desconocidas de I-Tonya (lista definitiva).pdf"
        ],
        "englishAnalysis": "Un festín de acentos regionales americanos, específicamente de clase trabajadora. El lenguaje es muy coloquial, a menudo explícito, y está lleno de justificaciones, sarcasmo y jerga de patinaje artístico ('triple axel', 'landing', 'judges'). Un gran reto para entender inglés no estándar."
    },
    {
        "title": "Rocky I",
        "pdfs": [
            "../Vocabularios/2024/Palabras desconocidas de Rocky I (lista definitiva).pdf"
        ],
        "englishAnalysis": "El origen de la saga ofrece el acento inconfundible italoamericano de Filadelfia. Diálogos sencillos, directos, con jerga callejera de los años 70 y vocabulario del mundo del boxeo. Ideal para acostumbrar el oído a pronunciaciones cerradas."
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
