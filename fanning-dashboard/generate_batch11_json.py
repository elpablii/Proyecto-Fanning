import fitz
import json
import os

movies = [
    {
        "title": "Star Wars Episodio V The Empire Strikes Back",
        "pdfs": ["../Vocabularios/2025/Palabras desconocidas de Star Wars Episodio V The Empire Strikes Back (lista definitiva).pdf"],
        "englishAnalysis": "El clímax dramático de Star Wars. Contiene un inglés más oscuro, místico (el entrenamiento de Yoda invirtiendo la sintaxis) y lenguaje formal imperial sobre emboscadas y tecnología."
    },
    {
        "title": "Thoroughbreds",
        "pdfs": ["../Vocabularios/2025/Palabras desconocidas de Thoroughbreds (lista definitiva).pdf"],
        "englishAnalysis": "Inglés de clase alta adolescente ('preppy'). Lenguaje sumamente articulado, manipulador, sarcástico y carente de emoción ('sociopathic'). Vocabulario sobre tutorías, caballos y crímenes limpios."
    },
    {
        "title": "3 Generations",
        "pdfs": ["../Vocabularios/2025/Palabras desconocidas de 3 Generations (lista definitiva).pdf"],
        "englishAnalysis": "Drama familiar de Nueva York. Inglés urbano rápido y sobrepuesto, con un fuerte enfoque en vocabulario de identidad de género, tratamientos médicos y complejas dinámicas intergeneracionales."
    },
    {
        "title": "Taken I",
        "pdfs": ["../Vocabularios/2025/Palabras desconocidas de Taken I (lista definitiva).pdf"],
        "englishAnalysis": "Un clásico del cine de acción moderno. Lenguaje directo, amenazante y muy conciso. Vocabulario centrado en secuestros, seguridad, tácticas de interrogación y negociación ('particular set of skills')."
    },
    {
        "title": "Taken III",
        "pdfs": ["../Vocabularios/2025/Palabras desconocidas de Taken III (lista definitiva).pdf"],
        "englishAnalysis": "Sigue la línea de acción directa, pero con más jerga policial y de investigaciones de la policía de Los Ángeles ('LAPD', 'suspect', 'warrant') mientras el protagonista es perseguido."
    },
    {
        "title": "Please Stand By",
        "pdfs": ["../Vocabularios/2025/Palabras desconocidas de Please Stand By (lista definitiva).pdf"],
        "englishAnalysis": "Una excelente ventana al espectro autista. Lenguaje muy literal, repetitivo y enfocado en rutinas ('schedule', 'rules'), mezclado extensivamente con terminología de fans de Star Trek."
    },
    {
        "title": "All the Bright Places",
        "pdfs": ["../Vocabularios/2025/Palabras desconocidas de All the Bright Places (lista definitiva).pdf"],
        "englishAnalysis": "Drama romántico juvenil en Indiana. El inglés es introspectivo, poético y a veces melancólico. Vocabulario relacionado con la salud mental, citas literarias y descubrimientos geográficos."
    },
    {
        "title": "Very Good Girls",
        "pdfs": ["../Vocabularios/2025/Palabras desconocidas de Very Good Girls (lista definitiva).pdf"],
        "englishAnalysis": "Inglés de jóvenes neoyorquinas en su último verano antes de la universidad. Diálogos informales, rápidos y con mucha jerga relacionada con el romance, la amistad y los celos adolescentes."
    },
    {
        "title": "The Neon Demon",
        "pdfs": ["../Vocabularios/2025/Palabras desconocidas de The Neon Demon (lista definitiva).pdf"],
        "englishAnalysis": "Inglés superficial, frío y elitista del mundo del modelaje en Los Ángeles. Vocabulario sobre belleza estética, fotografía, ambición desmedida y envidia, con diálogos muy pausados."
    },
    {
        "title": "I Think Were Alone Now",
        "pdfs": ["../Vocabularios/2025/Palabras desconocidas de I Think Were Alone Now (lista definitiva).pdf"],
        "englishAnalysis": "Drama post-apocalíptico. Muy poco diálogo, lo que resalta la claridad. Vocabulario centrado en la limpieza, el aislamiento, la catalogación y el duelo por la pérdida de la humanidad."
    },
    {
        "title": "Taken II",
        "pdfs": ["../Vocabularios/2025/Palabras desconocidas de Taken II (lista definitiva).pdf"],
        "englishAnalysis": "Ambientada en Estambul, mantiene la jerga de espionaje, tácticas evasivas y comunicación por radio ('coordinates', 'radius', 'grenade') bajo presión extrema."
    },
    {
        "title": "Vicious",
        "pdfs": ["../Vocabularios/2025/Palabras desconocidas de Vicious (lista definitiva).pdf"],
        "englishAnalysis": "Terror moderno (o corto). Lenguaje contemporáneo muy coloquial, con frases cortas dictadas por el pánico y vocabulario relacionado con el aislamiento en un apartamento y fenómenos extraños."
    },
    {
        "title": "Viena and the Fantomes",
        "pdfs": ["../Vocabularios/2025/Palabras desconocidas de Viena and the Fantomes (lista definitiva).pdf"],
        "englishAnalysis": "Inglés de la escena musical underground/punk de los años 80. Lenguaje nómada, drogas, rebelión y arte, con acentos americanos desaliñados y poco articulados."
    },
    {
        "title": "The Roads Not Taken",
        "pdfs": ["../Vocabularios/2025/Palabras desconocidas de The Roads Not Taken (lista definitiva).pdf"],
        "englishAnalysis": "Drama sobre la demencia. Diálogos fragmentados, repetitivos y confusos, útiles para entender el inglés cuando el interlocutor (Javier Bardem) tiene un fuerte acento y problemas cognitivos."
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
