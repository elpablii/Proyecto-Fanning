import fitz # PyMuPDF
import json
import os
import argparse
from pathlib import Path

def parse_pdf(pdf_path: str, bad_prefixes: list) -> list:
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
                    is_bad = any(word.startswith(bp) or trans.startswith(bp) for bp in bad_prefixes)
                    if not is_bad:
                        vocab.append({
                            "word": word,
                            "translation": trans
                        })
    except Exception as e:
        print(f"Error reading {pdf_path}: {e}")
    return vocab

def main():
    parser = argparse.ArgumentParser(description="Genera los JSON para el dashboard de Fanning")
    parser.add_argument('--config', type=str, required=True, help="Ruta al archivo JSON de configuración con las películas y PDFs")
    parser.add_argument('--outdir', type=str, default='../fanning-dashboard/public/data/pelis', help="Directorio de salida")
    args = parser.parse_args()

    out_dir = Path(args.outdir)
    out_dir.mkdir(parents=True, exist_ok=True)

    bad_prefixes = [
        "Unknown words", "Tour Film", "Palabras desconocidas",
        "Guión de la", "Guion de la", "Dialogues from"
    ]

    with open(args.config, 'r', encoding='utf-8') as f:
        movies = json.load(f)

    for m in movies:
        vocab = []
        for pdf_path in m.get("pdfs", []):
            vocab.extend(parse_pdf(pdf_path, bad_prefixes))
        
        data = {
            "title": m["title"],
            "englishAnalysis": m.get("englishAnalysis", ""),
            "vocabulary": vocab
        }
        
        out_path = out_dir / f"{m['title']}.json"
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        
        print(f"Generado {out_path} con {len(vocab)} palabras.")

if __name__ == "__main__":
    main()
