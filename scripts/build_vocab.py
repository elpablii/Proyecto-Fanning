import os
import pypdf
import collections
import re
import json
import uuid
from spellchecker import SpellChecker

spell_en = SpellChecker(language='en')
spell_es = SpellChecker(language='es')

vocab_dir = r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\Vocabularios"
output_file = r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data\vocabulario.json"

pdf_files = []
for root, dirs, files in os.walk(vocab_dir):
    for f in files:
        if f.lower().endswith('.pdf'):
            pdf_files.append(os.path.join(root, f))

all_items = []
word_counts = collections.Counter()

for pdf_path in pdf_files:
    year = "Desconocido"
    if "2023" in pdf_path: year = "2023"
    elif "2024" in pdf_path: year = "2024"
    elif "2025" in pdf_path: year = "2025"
    
    filename = os.path.basename(pdf_path)
    match = re.search(r"Palabras desconocidas de (.*?)(?:\s*\(.*lista definitiva.*\))?\.pdf", filename, re.IGNORECASE)
    if match:
        source_movie = match.group(1).strip()
    else:
        source_movie = filename.replace('.pdf', '').strip()
        
    try:
        reader = pypdf.PdfReader(pdf_path)
        for page in reader.pages:
            text = page.extract_text()
            if not text:
                continue
            lines = text.split('\n')
            for line in lines:
                line = line.strip()
                if not line:
                    continue
                
                # Ignorar encabezados y títulos basura de forma más agresiva
                line_lower = line.lower()
                if "unknown word" in line_lower or "unknown phrase" in line_lower or "words/phrases" in line_lower or "words and phrases" in line_lower:
                    continue
                
                word = ""
                translation = "No registrada"
                
                # Separar por dos puntos o guion
                if ':' in line:
                    parts = line.split(':', 1)
                    word = parts[0].strip()
                    translation = parts[1].strip()
                elif ' - ' in line:
                    parts = line.split(' - ', 1)
                    word = parts[0].strip()
                    translation = parts[1].strip()
                else:
                    word = line.strip()

                # --- MÓDULO DE AUTOCORRECCIÓN ---
                # Función interna para corregir frases palabra por palabra respetando mayúsculas
                def autocorrect_phrase(phrase, spell_checker):
                    if not phrase or phrase == "No registrada":
                        return phrase
                    words = re.findall(r'\b\w+\b', phrase)
                    corrected = phrase
                    for w in words:
                        # Ignorar palabras muy cortas, todo en mayúsculas (acrónimos), o con números
                        if len(w) > 2 and w.isalpha() and not w.isupper():
                            # Revisar si pyspellchecker la considera un error
                            # known() devuelve las palabras que sí reconoce. Si no está, intentamos corregir.
                            if not spell_checker.known([w.lower()]):
                                cw = spell_checker.correction(w)
                                # Solo aplicamos si encontró corrección y no es None
                                if cw and cw.lower() != w.lower():
                                    # Cautela: si la palabra original empieza con mayúscula, la corregida también
                                    if w[0].isupper():
                                        cw = cw.capitalize()
                                    corrected = re.sub(r'\b' + w + r'\b', cw, corrected)
                    return corrected

                # Aplicar autocorrección
                # Nota: Si el texto contiene paréntesis como "(verbo)", la regex \b\w+\b solo tomará "verbo"
                word = autocorrect_phrase(word, spell_en)
                translation = autocorrect_phrase(translation, spell_es)
                
                # Convertimos a minuscula solo para contar frecuencias de forma exacta.
                word_clean = word.lower()
                
                # Un vocabulario o phrasal verb real rara vez supera los 40-50 caracteres.
                # Si es más largo, probablemente sea un error de extracción (un párrafo o título).
                if word and len(word) < 45 and len(word) > 1: 
                    word_counts[word_clean] += 1
                    
                    item = {
                        "id": f"v_{uuid.uuid4().hex[:8]}",
                        "word": word,
                        "translation": translation,
                        "source_movie": source_movie,
                        "year_processed": year,
                        "search_key": word_clean
                    }
                    all_items.append(item)
                    
    except Exception as e:
        print(f"Error reading {pdf_path}: {e}")

# Asignar frecuencias y limpiar
final_data = []
for item in all_items:
    item["global_frequency"] = word_counts[item["search_key"]]
    del item["search_key"]
    final_data.append(item)

os.makedirs(os.path.dirname(output_file), exist_ok=True)

with open(output_file, "w", encoding="utf-8") as f:
    json.dump(final_data, f, ensure_ascii=False, indent=2)

print(f"[OK] Procesamiento completado. Se generaron {len(final_data)} entradas de vocabulario.")
print(f"Guardado en: {output_file}")
