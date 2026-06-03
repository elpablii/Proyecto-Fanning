import os
import re

vocab_dir = r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\Vocabularios"
dialogos_dir = r"c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\Diálogos"

# Get all vocabulary names
vocab_names = []
for root, dirs, files in os.walk(vocab_dir):
    for f in files:
        if f.lower().endswith('.pdf'):
            # Example: "Palabras desconocidas de About Time (lista definitiva).pdf"
            # Extract "About Time"
            # Modified to handle "(Parte 1 - lista definitiva)" etc
            match = re.search(r"Palabras desconocidas de (.*?)(?:\s*\(.*lista definitiva.*\))?\.pdf", f, re.IGNORECASE)
            if match:
                vocab_names.append(match.group(1).strip())
            else:
                vocab_names.append(f.replace('.pdf', '').strip())

# Get all dialogue filenames
dialogo_files = []
for root, dirs, files in os.walk(dialogos_dir):
    for f in files:
        # Just keep the filename without extension for comparison
        name_no_ext = os.path.splitext(f)[0].lower()
        dialogo_files.append(name_no_ext)

# Compare
missing = []
for v_name in vocab_names:
    v_name_lower = v_name.lower()
    # Check if v_name is a substring of any dialogue file, or vice versa
    found = False
    for d_name in dialogo_files:
        # Simplify names for matching (remove special characters, spaces)
        v_simp = re.sub(r'[^a-z0-9]', '', v_name_lower)
        d_simp = re.sub(r'[^a-z0-9]', '', d_name)
        
        if v_simp in d_simp or d_simp in v_simp:
            found = True
            break
            
    if not found:
        missing.append(v_name)

print(f"Total vocabularios: {len(vocab_names)}")
print(f"Total diálogos subidos: {len(dialogo_files)}")
print("\n--- FALTAN LOS DIÁLOGOS DE: ---")
for m in sorted(missing):
    print(f"- {m}")
