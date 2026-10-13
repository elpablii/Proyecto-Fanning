import os
import pypdf
import collections
import re

vocab_dir = r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\Vocabularios"
pdf_files = []
for root, dirs, files in os.walk(vocab_dir):
    for f in files:
        if f.lower().endswith('.pdf'):
            pdf_files.append(os.path.join(root, f))

# Diccionarios para cada año y el global
counts_per_year = {
    "2023": collections.Counter(),
    "2024": collections.Counter(),
    "2025": collections.Counter(),
    "Global": collections.Counter()
}

for pdf_path in pdf_files:
    # Extract the year from the path (assuming year is a folder name in the path)
    year = "Desconocido"
    if "2023" in pdf_path: year = "2023"
    elif "2024" in pdf_path: year = "2024"
    elif "2025" in pdf_path: year = "2025"
    
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
                # Skip likely headers or page numbers
                if "unknown words from" in line.lower() or "words/phrases" in line.lower():
                    continue
                
                # The word is usually before the colon
                if ':' in line:
                    english_part = line.split(':')[0].strip().lower()
                elif ' - ' in line:
                    english_part = line.split(' - ')[0].strip().lower()
                else:
                    english_part = line.strip().lower()
                
                # Remove brackets or parentheses for cleaner counting:
                english_part = re.sub(r'\(.*?\)', '', english_part).strip()
                
                if english_part and len(english_part) < 40: # avoid super long phrases or sentences
                    counts_per_year["Global"][english_part] += 1
                    if year in counts_per_year:
                        counts_per_year[year][english_part] += 1
                        
    except Exception as e:
        print(f"Error reading {pdf_path}: {e}")

# Imprimir resultados
for category in ["2023", "2024", "2025", "Global"]:
    print(f"\n--- Top 10 palabras más repetidas ({category}) ---")
    for word, count in counts_per_year[category].most_common(10):
        print(f"{count} veces: {word}")

