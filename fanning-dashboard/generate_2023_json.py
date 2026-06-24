import fitz
import json
import os

movies = [
    {
        "title": "Barbie",
        "pdf": "../Vocabularios/2023/Palabras desconocidas de Barbie (lista definitiva).pdf",
        "englishAnalysis": "La película presenta un inglés mayormente americano con un tono muy moderno, optimista y pop. Utiliza vocabulario relacionado con el empoderamiento, conceptos existenciales ('patriarchy', 'cognitive dissonance', 'fascism') mezclados con términos superficiales y corporativos. Destaca por el contraste entre el lenguaje inocente de Barbieland y el inglés del mundo real corporativo."
    },
    {
        "title": "Bombshell",
        "pdf": "../Vocabularios/2023/Palabras desconocidas de Bombshell (lista definitiva).pdf",
        "englishAnalysis": "Presenta un inglés americano corporativo y periodístico ('newsroom'). El lenguaje es rápido, incisivo e incluye mucha jerga de los medios de comunicación, política y televisión ('anchor', 'network', 'harassment', 'NDA'). Es ideal para familiarizarse con el inglés del entorno profesional."
    },
    {
        "title": "The Polar Express",
        "pdf": "../Vocabularios/2023/Palabras desconocidas de El Expreso Polar (lista definitiva).pdf",
        "englishAnalysis": "El vocabulario es familiar, nostálgico y relacionado con la Navidad ('sleigh', 'reindeer', 'conductor', 'believe'). El lenguaje es claro y descriptivo, con un tono mágico y aventurero. Excelente para aprender vocabulario descriptivo de invierno y expresiones más tradicionales."
    },
    {
        "title": "Focus",
        "pdf": "../Vocabularios/2023/Palabras desconocidas de Focus (lista definitiva).pdf",
        "englishAnalysis": "Se caracteriza por un inglés dinámico y persuasivo centrado en la jerga criminal, las apuestas y la estafa ('con', 'mark', 'grifter', 'pickpocket'). Incluye diálogos rápidos, manipulación psicológica y lenguaje de la calle combinado con términos de alta sociedad."
    },
    {
        "title": "Taylor Swift Miss Americana",
        "pdf": "../Vocabularios/2023/Palabras desconocidas de Taylor Swift Miss Americana (lista definitiva).pdf",
        "englishAnalysis": "Muestra un inglés americano contemporáneo muy personal e íntimo. El vocabulario incluye términos del mundo de la música, la fama, redes sociales y política ('songwriting', 'backlash', 'approval', 'midterms'). Además, se utiliza mucha jerga de internet y expresiones de vulnerabilidad emocional."
    }
]

os.makedirs('public/data/pelis', exist_ok=True)

for m in movies:
    pdf_path = m["pdf"]
    vocab = []
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
