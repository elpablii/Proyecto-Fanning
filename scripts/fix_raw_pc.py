import json

path = 'fanning-dashboard/public/data/2026/vocabulario_the_perfect_couple.json'
with open(path, 'r', encoding='utf-8') as f:
    data = json.load(f)

for item in data:
    if item.get('source_movie') == 'The Perfect Couple (Episodes)':
        item['source_movie'] = 'The Perfect Couple (Episode 6)'

with open(path, 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Fixed source_movie in raw JSON.")
