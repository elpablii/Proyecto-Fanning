import os
import json
import re

def clean_text(text):
    if not isinstance(text, str):
        return text
    # Replace smart quotes with straight quotes
    text = text.replace('’', "'").replace('‘', "'").replace('´', "'").replace('`', "'")
    text = text.replace('“', '"').replace('”', '"')
    # Remove multiple spaces
    text = re.sub(r'\s+', ' ', text)
    # Trim whitespace
    return text.strip()

def process_directory(directory):
    if not os.path.exists(directory):
        return 0
    
    fixed_count = 0
    for filename in os.listdir(directory):
        if not filename.endswith('.json'):
            continue
            
        filepath = os.path.join(directory, filename)
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                data = json.load(f)
                
            changed = False
            
            # Fix vocabulary
            if 'vocabulary' in data and isinstance(data['vocabulary'], list):
                for item in data['vocabulary']:
                    if isinstance(item, dict):
                        for key in ['word', 'translation']:
                            if key in item and isinstance(item[key], str):
                                old_val = item[key]
                                new_val = clean_text(old_val)
                                if old_val != new_val:
                                    item[key] = new_val
                                    changed = True
            
            # Fix englishAnalysis
            if 'englishAnalysis' in data and isinstance(data['englishAnalysis'], str):
                old_val = data['englishAnalysis']
                new_val = clean_text(old_val)
                if old_val != new_val:
                    data['englishAnalysis'] = new_val
                    changed = True

            if changed:
                with open(filepath, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                fixed_count += 1
                
        except Exception as e:
            print(f"Error processing {filename}: {e}")
            
    return fixed_count

if __name__ == '__main__':
    pelis_dir = os.path.join('fanning-dashboard', 'public', 'data', 'pelis')
    series_dir = os.path.join('fanning-dashboard', 'public', 'data', 'series')
    
    print(f"Fixed {process_directory(pelis_dir)} files in pelis/")
    print(f"Fixed {process_directory(series_dir)} files in series/")
