import fitz
import json
import re

pdf_path = 'Diálogos/Diálogos Series/Dialogues from The Girl From Plainville to improve the vocabulary in English.pdf'
doc = fitz.open(pdf_path)

text = ""
for page in doc:
    text += page.get_text()

# Dividir por episodios
# Buscar "EP1:", "EP2:", etc.
episodes_text = re.split(r'\bEP\d+:', text)

# El índice 0 es el encabezado del documento
episodes_text = episodes_text[1:]

dialogue_counts = []

for i, ep_text in enumerate(episodes_text):
    lines = ep_text.split('\n')
    
    # Un bloque de subtítulo válido tiene un número, un timestamp y luego el texto
    # Pero para simplificar, buscaremos el patrón del timestamp "-->"
    # Todo el texto que le sigue hasta el próximo número/timestamp es el diálogo
    
    blocks = re.split(r'\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}', ep_text)
    
    # El primer bloque es el título o basura antes del primer timestamp
    count = 0
    for block in blocks[1:]:
        # block contiene el texto del diálogo, seguido posiblemente del número del siguiente subtítulo
        # Limpiar el bloque (quitar el número del final si está suelto en una línea)
        block_lines = block.strip().split('\n')
        # La última línea suele ser el ID del próximo subtítulo, la ignoramos si es solo un número
        valid_text = " ".join([l for l in block_lines if not re.match(r'^\s*\d+\s*$', l)])
        
        # Verificar si tiene al menos una letra
        if re.search(r'[a-zA-ZáéíóúÁÉÍÓÚñÑ]', valid_text):
            count += 1
            
    dialogue_counts.append(count)
    print(f"Episode {i+1} dialogues: {count}")

# Actualizar el JSON
json_path = 'fanning-dashboard/public/data/pelis/The Girl From Plainville.json'
with open(json_path, 'r', encoding='utf-8') as f:
    d = json.load(f)

if 'episodes' in d:
    for i, ep in enumerate(d['episodes']):
        if i < len(dialogue_counts):
            ep['dialogues'] = dialogue_counts[i]

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(d, f, ensure_ascii=False, indent=2)

print("Updated The Girl From Plainville.json with dialogue counts")
