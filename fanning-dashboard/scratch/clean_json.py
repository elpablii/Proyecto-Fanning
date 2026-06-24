import json
import os
import glob

pelis_dir = "public/data/pelis/"
files = glob.glob(os.path.join(pelis_dir, "*.json"))

bad_prefixes = [
    "Unknown words",
    "Tour Film",
    "Palabras desconocidas",
    "Guión de la",
    "Guion de la",
    "Dialogues from"
]

for file_path in files:
    with open(file_path, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    original_len = len(data["vocabulary"])
    new_vocab = []
    
    for item in data["vocabulary"]:
        word = item["word"]
        trans = item["translation"]
        
        is_bad = False
        for bp in bad_prefixes:
            if word.startswith(bp) or trans.startswith(bp):
                is_bad = True
                break
        
        if not is_bad:
            new_vocab.append(item)
            
    if len(new_vocab) != original_len:
        data["vocabulary"] = new_vocab
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Cleaned {file_path}: {original_len} -> {len(new_vocab)}")
    else:
        print(f"No changes in {file_path}")

