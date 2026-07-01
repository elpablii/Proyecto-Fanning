import fitz
import json
import os

movies = [
    {
        "title": "21 Blackjack",
        "pdfs": ["../Vocabularios/2025/Palabras desconocidas de 21 Blackjack (lista definitiva).pdf"],
        "englishAnalysis": "Inglés universitario y matemático. Lleno de jerga de casino ('counting cards', 'chips', 'hit me') y expresiones sobre inteligencia, probabilidades y vida estudiantil americana."
    },
    {
        "title": "American Pastoral",
        "pdfs": ["../Vocabularios/2025/Palabras desconocidas de American Pastoral (lista definitiva).pdf"],
        "englishAnalysis": "Drama histórico estadounidense. Vocabulario político y social de los años 60, mezclado con lenguaje de negocios de clase media-alta y expresiones de desilusión y protesta."
    },
    {
        "title": "Star Wars Episodio VI Return of the Jedi",
        "pdfs": ["../Vocabularios/2025/Palabras desconocidas de Star Wars Episodio VI Return of the Jedi (lista definitiva).pdf"],
        "englishAnalysis": "La culminación de la trilogía original. Lenguaje místico sobre la redención y el destino ('dark side', 'destiny'), junto con términos tácticos militares y acentos británicos imperiales clásicos."
    },
    {
        "title": "Galveston",
        "pdfs": ["../Vocabularios/2025/Palabras desconocidas de Galveston (lista definitiva).pdf"],
        "englishAnalysis": "Un inglés crudo y oscuro del sur de Estados Unidos (Texas/Louisiana). Acentos fuertes, lenguaje callejero, jerga criminal ('hitman', 'setup') y diálogos melancólicos."
    },
    {
        "title": "El Padrino I",
        "pdfs": ["../Vocabularios/2025/Palabras desconocidas de El Padrino I (lista definitiva).pdf"],
        "englishAnalysis": "El estándar de oro del acento italoamericano de los años 40. Lenguaje mafioso sutil, lleno de metáforas familiares ('family', 'business', 'offer he can\\'t refuse') y respeto formal."
    },
    {
        "title": "Split",
        "pdfs": ["../Vocabularios/2025/Palabras desconocidas de Split (lista definitiva).pdf"],
        "englishAnalysis": "Un desafío fascinante: el actor principal cambia constantemente de acento, vocabulario y tono de voz (desde un niño hasta un líder culto y una bestia). Excelente para la psicología y la inflexión de voz."
    },
    {
        "title": "A Nonsense Christmas with Sabrina Carpenter",
        "pdfs": ["../Vocabularios/2025/Palabras desconocidas de A Nonsense Christmas with Sabrina Carpenter (lista definitiva).pdf"],
        "englishAnalysis": "Inglés juvenil contemporáneo, festivo y muy sarcástico. Lleno de juegos de palabras, jerga pop actual ('slang') y expresiones modernas de la Generación Z en un contexto navideño."
    },
    {
        "title": "Non-stop",
        "pdfs": ["../Vocabularios/2025/Palabras desconocidas de Non-stop (lista definitiva).pdf"],
        "englishAnalysis": "Thriller de acción con lenguaje de aviación civil ('air marshal', 'hijack', 'cockpit'). Frases cortas, asertivas y tensas orientadas a la resolución de problemas y la interrogación."
    },
    {
        "title": "Cuckoo",
        "pdfs": ["../Vocabularios/2025/Palabras desconocidas de Cuckoo (lista definitiva).pdf"],
        "englishAnalysis": "Terror psicológico con una interesante mezcla de inglés hablado por europeos (alemanes). Vocabulario de aislamiento, misterio biológico y jerga adolescente americana desubicada."
    },
    {
        "title": "Olivia Rodrigo Guts World Tour",
        "pdfs": ["../Vocabularios/2025/Palabras desconocidas de Olivia Rodrigo Guts World Tour (lista definitiva).pdf"],
        "englishAnalysis": "Inglés de concierto en vivo. Interacción con multitudes ('crowd work'), jerga generacional, y letras musicales crudas y emocionales sobre la transición a la adultez."
    },
    {
        "title": "The Runaways",
        "pdfs": ["../Vocabularios/2025/Palabras desconocidas de The Runaways (lista definitiva).pdf"],
        "englishAnalysis": "Inglés musical de los años 70 en California. Lenguaje callejero, rebelde y enfocado en la industria del rock ('gigs', 'record deal', 'band'). Acentos juveniles con mucha actitud."
    },
    {
        "title": "The Watchers",
        "pdfs": ["../Vocabularios/2025/Palabras desconocidas de The Watchers (lista definitiva).pdf"],
        "englishAnalysis": "Terror folclórico irlandés. Ideal para exponerse a acentos irlandeses auténticos, vocabulario descriptivo de bosques, supervivencia y leyendas locales ('changelings', 'coop')."
    },
    {
        "title": "Lilo and Stitch I",
        "pdfs": ["../Vocabularios/2025/Palabras desconocidas de Lilo and Stitch I (lista definitiva).pdf"],
        "englishAnalysis": "Inglés familiar encantador con un fuerte sabor hawaiano (uso de palabras locales como 'ohana'). Mezclado divertidamente con jerga alienígena y jerga de trabajadores sociales ('probation')."
    },
    {
        "title": "Rocky IV",
        "pdfs": ["../Vocabularios/2025/Palabras desconocidas de Rocky IV (lista definitiva).pdf"],
        "englishAnalysis": "Lenguaje icónico de la Guerra Fría. Contrastes entre el inglés motivacional americano de Rocky y Apollo, contra el inglés robótico y rígido de Drago ('I must break you')."
    },
    {
        "title": "Super Mario Bros The Movie",
        "pdfs": ["../Vocabularios/2025/Palabras desconocidas de Super Mario Bros The Movie (lista definitiva).pdf"],
        "englishAnalysis": "Animación hiper-dinámica. Inglés americano estándar muy claro con bromas constantes, vocabulario de Brooklyn exagerado, términos de fontanería y del universo Nintendo."
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
