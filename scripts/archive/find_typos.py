import os
import json
import re

try:
    from spellchecker import SpellChecker
except ImportError:
    print("Por favor, instala pyspellchecker: pip install pyspellchecker")
    exit(1)

def is_literal(text):
    # Asumimos que no es literal si tiene paréntesis (jerga, acotación, frase no literal)
    if '(' in text or ')' in text:
        return False
    return True

def get_words(text):
    # Extraer solo palabras con letras (sin puntuación)
    return [w for w in re.findall(r'\b[a-záéíóúüñ]+\b', text.lower()) if len(w) > 2]

def run_spellcheck():
    print("Inicializando diccionarios (puede tardar unos segundos)...")
    spell_en = SpellChecker(language='en')
    spell_es = SpellChecker(language='es')
    
    pelis_dir = os.path.join('fanning-dashboard', 'public', 'data', 'pelis')
    series_dir = os.path.join('fanning-dashboard', 'public', 'data', 'series')
    
    suggestions = []
    
    def process_dir(directory):
        if not os.path.exists(directory): return
        for f in os.listdir(directory):
            if not f.endswith('.json'): continue
            
            with open(os.path.join(directory, f), encoding='utf-8') as file:
                data = json.load(file)
            
            for v in data.get('vocabulary', []):
                word = v.get('word', '')
                trans = v.get('translation', '')
                
                # Check English
                if is_literal(word):
                    words = get_words(word)
                    if len(words) <= 3: # Solo chequear palabras cortas o frases muy cortas
                        unknown = spell_en.unknown(words)
                        for u in unknown:
                            corr = spell_en.correction(u)
                            if corr and corr != u:
                                suggestions.append(f"[{f}] INGLÉS: '{u}' -> '{corr}' (Contexto: '{word}')")
                                
                # Check Spanish
                if is_literal(trans):
                    words = get_words(trans)
                    if len(words) <= 3:
                        unknown = spell_es.unknown(words)
                        for u in unknown:
                            corr = spell_es.correction(u)
                            if corr and corr != u:
                                suggestions.append(f"[{f}] ESPAÑOL: '{u}' -> '{corr}' (Contexto: '{trans}')")
                                
    print("Escaneando Películas...")
    process_dir(pelis_dir)
    print("Escaneando Series...")
    process_dir(series_dir)
    
    # Escribir a un archivo para revisar
    out_file = 'spelling_suggestions.txt'
    with open(out_file, 'w', encoding='utf-8') as out:
        for s in suggestions:
            out.write(s + '\n')
            
    print(f"Completado. Se encontraron {len(suggestions)} posibles errores tipográficos.")
    print(f"Revisa el archivo '{out_file}' antes de aplicar los cambios automáticamente.")

if __name__ == '__main__':
    run_spellcheck()
