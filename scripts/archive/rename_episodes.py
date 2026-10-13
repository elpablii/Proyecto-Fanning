import json
json_path = r'c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data\pelis\Euphoria.json'
with open(json_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

for ep in data['episodes']:
    name = ep['name']
    if 'Trouble' in name:
        ep['name'] = "Special 1 - Trouble Don't Last Always"
    elif 'Sea Blob' in name:
        ep['name'] = "Special 2 - Fuck Anyone Who's Not a Sea Blob"
    else:
        # Standardize format: 'S01E1: Pilot' -> 'S01E01 - Pilot'
        parts = name.split(':', 1)
        if len(parts) == 2:
            code = parts[0]
            title = parts[1].strip()
            # code is S01E1, we want S01E01
            code = code[:4] + code[4:].zfill(2)
            ep['name'] = f'{code} - {title}'

with open(json_path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)
print('Fixed episode names in JSON.')
