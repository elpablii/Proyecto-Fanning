import os
import re

vocab_dir = r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\Vocabularios"
dialogos_dir = r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\Diálogos"

# Get all vocabulary names
vocab_names = []
for root, dirs, files in os.walk(vocab_dir):
    for f in files:
        if f.lower().endswith('.pdf'):
            match = re.search(r"Palabras desconocidas de (.*?)(?:\s*\(.*lista definitiva.*\))?\.pdf", f, re.IGNORECASE)
            if match:
                vocab_names.append(match.group(1).strip())
            else:
                vocab_names.append(f.replace('.pdf', '').strip())

# Get all dialogue filenames
dialogo_files = []
for root, dirs, files in os.walk(dialogos_dir):
    for f in files:
        name_no_ext = os.path.splitext(f)[0].strip()
        dialogo_files.append(name_no_ext)

with open("vocab_names.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(sorted(vocab_names)))

with open("dialogo_names.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(sorted(dialogo_files)))
