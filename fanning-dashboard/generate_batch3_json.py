import fitz
import json
import os

movies = [
    {
        "title": "Escuadrón Suicida",
        "pdfs": [
            "../Vocabularios/2024/Palabras desconocidas de Escuadrón Suicida (Parte 1 - lista definitiva).pdf",
            "../Vocabularios/2024/Palabras desconocidas de Escuadrón Suicida (Parte 2 - lista definitiva).pdf"
        ],
        "englishAnalysis": "El lenguaje de esta película de 2016 está lleno de jerga callejera, términos criminales, sarcasmo y lenguaje militar táctico ('task force', 'lethal', 'warden', 'freaks'). Es ideal para familiarizarse con expresiones informales agresivas, insultos suaves y acentos americanos diversos (desde el estilo urbano de Harley Quinn hasta el militar sureño de Rick Flag)."
    },
    {
        "title": "El Escuadrón Suicida",
        "pdfs": [
            "../Vocabularios/2024/Palabras desconocidas de El Escuadrón Suicida (Parte 1 - lista definitiva).pdf",
            "../Vocabularios/2024/Palabras desconocidas de El Escuadrón Suicida (Parte 2 - lista definitiva).pdf"
        ],
        "englishAnalysis": "En esta secuela de 2021, el inglés es aún más explícito, brutal y teñido de humor negro. Presenta una mezcla fascinante de acentos (británicos, americanos y acentos fingidos) con jerga de mercenarios ('bounty', 'expendable', 'bloodbath') e insultos muy creativos."
    },
    {
        "title": "Ámsterdam",
        "pdfs": [
            "../Vocabularios/2024/Palabras desconocidas de Ámsterdam (Parte 1 - lista definitiva).pdf",
            "../Vocabularios/2024/Palabras desconocidas de Ámsterdam (Parte 2 - lista definitiva).pdf"
        ],
        "englishAnalysis": "Ambientada en los años 30, presenta un inglés de época con diálogos rápidos, verborreicos e intelectuales. Encontrarás mucho vocabulario médico, legal y político ('autopsy', 'veteran', 'conspiracy', 'fascism'). Excelente para practicar comprensión auditiva de ritmo rápido y humor satírico."
    },
    {
        "title": "Once Upon a Time in Hollywood",
        "pdfs": [
            "../Vocabularios/2024/Palabras desconocidas de Once Upon a Time in Hollywood (Parte 1 - lista definitiva).pdf",
            "../Vocabularios/2024/Palabras desconocidas de Once Upon a Time in Hollywood (Parte 2 - lista definitiva).pdf"
        ],
        "englishAnalysis": "Una obra maestra de Quentin Tarantino que captura perfectamente el argot californiano de finales de los años 60. Lleno de expresiones de la cultura hippie ('groovy', 'far out'), jerga de la industria cinematográfica de Hollywood ('stunt double', 'leading man', 'spaghetti western') y diálogos conversacionales fluidos."
    },
    {
        "title": "Mary Queen of Scots",
        "pdfs": [
            "../Vocabularios/2024/Palabras desconocidas de Mary Queen of Scots (lista definitiva).pdf"
        ],
        "englishAnalysis": "Una excelente oportunidad para exponerse al inglés antiguo, formal y monárquico del siglo XVI ('treason', 'sovereign', 'heir', 'realm'). Predominan los acentos británicos y escoceses, lo que supone un reto fantástico para el oído, lleno de intrigas políticas y religiosas."
    },
    {
        "title": "Los Increibles",
        "pdfs": [
            "../Vocabularios/2024/Palabras desconocidas de Los Increibles (lista definitiva).pdf"
        ],
        "englishAnalysis": "A pesar de ser animada, ofrece un inglés americano dinámico, claro y muy variado. Combina el lenguaje cotidiano y familiar de los suburbios ('homework', 'grounded', 'allowance') con terminología de superhéroes y espionaje ('secret identity', 'gadget', 'monologue', 'syndrome')."
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
