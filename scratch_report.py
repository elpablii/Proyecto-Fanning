import json

manifest_path = r'c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data\manifest.json'
with open(manifest_path, 'r', encoding='utf-8') as f:
    data = json.load(f)

out = ['# Contenido Considerado en las Métricas por Año\n']
out.append('Este documento detalla las películas y series contabilizadas para el cálculo de diálogos y palabras en cada año.\n')

year_movies = set()
for year in ['2023', '2024', '2025', '2026', '2027']:
    out.append(f'## Ciclo {year}')
    if year in data and 'movieList' in data[year]:
        movies = data[year]['movieList']
        for m in movies: year_movies.add(m['title'])
        movies = sorted(movies, key=lambda x: x.get('dialogues', 0), reverse=True)
        total_dialogues = sum(m.get('dialogues', 0) for m in movies)
        out.append(f'**Total Diálogos del Año:** {total_dialogues:,}')
        out.append(f'**Total Obras:** {len(movies)}\n')
        for m in movies:
            t = m['title']
            d = m.get('dialogues', 0)
            out.append(f'- {t} ({d:,} líneas)')
        out.append('\n')

out.append('## Series (Global / Sin año específico)')
all_movies = data.get('all', {}).get('movieList', [])
series_or_other = [m for m in all_movies if m['title'] not in year_movies]
series_or_other = sorted(series_or_other, key=lambda x: x.get('dialogues', 0), reverse=True)

if series_or_other:
    total_dialogues = sum(m.get('dialogues', 0) for m in series_or_other)
    out.append(f'**Total Diálogos:** {total_dialogues:,}')
    out.append(f'**Total Obras:** {len(series_or_other)}\n')
    for m in series_or_other:
        t = m['title']
        d = m.get('dialogues', 0)
        out.append(f'- {t} ({d:,} líneas)')

with open('temp_report.md', 'w', encoding='utf-8') as f:
    f.write('\n'.join(out))
print("DONE")
