import json
import os
import re

def clean_movie_title(raw_title):
    title = raw_title
    title = re.sub(r'\(lista.*?\)', '', title, flags=re.IGNORECASE)
    title = re.sub(r'\(S\d+EP.*?\)', '', title, flags=re.IGNORECASE)
    title = re.sub(r'\(Season.*?\)', '', title, flags=re.IGNORECASE)
    title = re.sub(r'parte \d', '', title, flags=re.IGNORECASE)
    if re.match(r'^Cars I$', title.strip(), re.IGNORECASE): title = "Cars"
    if re.match(r'^Cars II$', title.strip(), re.IGNORECASE): title = "Cars 2"
    return title.strip()

data_dir = r'c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data\2026'
out_dir = r'c:\Users\Pablo\Documents\GitHub\Proyecto-Fanning\fanning-dashboard\public\data\pelis'

movie_files = {
    'vocabulario_jojo_rabbit.json': "Una brillante sátira ambientada en la Alemania nazi. El inglés es peculiar, ya que los actores hablan con acentos alemanes exagerados, combinando jerga moderna con terminología de la guerra y el adoctrinamiento juvenil. Excelente para practicar la comprensión de acentos extranjeros.",
    'vocabulario_glass.json': "El vocabulario incluye jerga médica y psiquiátrica debido al entorno institucional, así como términos de cómics y superhéroes tratados desde una perspectiva clínica. El diálogo oscila entre tonos analíticos y fuertemente dramáticos.",
    'vocabulario_20th_century_women.json': "Ubicada a finales de los años 70 en California. Es perfecta para explorar el vocabulario sobre feminismo, cultura punk y la contracultura de la época. El inglés es coloquial e intelectual, reflejando las enormes brechas generacionales.",
    'vocabulario_barry.json': "Centrada en los años universitarios de Barack Obama, ofrece un vistazo a la vida en los campus estadounidenses en los 80. Presenta vocabulario académico, discusiones sobre identidad, y un marcado contraste entre el habla intelectual y la jerga de Nueva York.",
    'vocabulario_leave_no_trace.json': "Un drama introspectivo y silencioso. El vocabulario es minimalista y muy ligado a la supervivencia en la naturaleza, el campismo y el sistema de bienestar infantil. El inglés es pausado, claro y se enfoca en el lenguaje no verbal.",
    'vocabulario_ordinary_love.json': "Un drama íntimo ambientado en Irlanda. El vocabulario médico abunda (debido a un diagnóstico de cáncer), así como el inglés doméstico de una pareja de la tercera edad. Permite acostumbrarse al acento norirlandés suave y melancólico.",
    'vocabulario_the_motel_life.json': "Una película de tono crudo y realista. El inglés refleja las dificultades de la clase trabajadora estadounidense, con jerga sobre trabajos precarios y problemas legales. El lenguaje es coloquial, directo y cargado de regionalismos del oeste.",
    'vocabulario_a_big_bold_beautiful_journey.json': "Una película emocional que ofrece un inglés moderno y accesible. El vocabulario gira en torno a las relaciones humanas, los viajes y el descubrimiento personal, destacando por sus diálogos dinámicos e íntimos.",
    'vocabulario_toy_story_iv.json': "Como es tradición en Pixar, el inglés es nítido y apto para toda la familia. Incluye divertidos juegos de palabras, jerga de ferias de atracciones, y expresiones sobre el propósito y la lealtad. Ideal para aprender el habla cotidiana.",
    'vocabulario_maleficent_ii_mistress_of_evil.json': "Fantasía épica con un vocabulario casi shakesperiano. Las cortes reales, los hechizos y las intrigas exigen un inglés muy formal y con toques arcaicos. Destaca la dicción impecable del acento británico de la nobleza.",
    'vocabulario_night_moves.json': "Un thriller psicológico protagonizado por eco-terroristas. El vocabulario incluye terminología agrícola, activismo y manipulación de explosivos. El inglés suele ser susurrado, tenso y directo, reflejando la paranoia constante.",
    'vocabulario_super_mario_galaxy.json': "Una aventura lúdica e imaginativa. El vocabulario está impregnado de términos del espacio, la exploración y la magia. Al estar dirigido a un público amplio, las expresiones son sencillas, muy entusiastas y fáciles de seguir.",
    'vocabulario_maleficent_i.json': "El tono es majestuoso y de cuento de hadas. El vocabulario es clásico y poético, lleno de términos de realeza y magia. El impecable acento británico de Angelina Jolie es ideal para aprender sobre estructuras formales y entonación teatral."
}

for filename, desc in movie_files.items():
    filepath = os.path.join(data_dir, filename)
    if not os.path.exists(filepath):
        print(f"File not found: {filename}")
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    if not data or not isinstance(data, list):
        print(f"Invalid data in {filename}")
        continue
        
    raw_title = data[0].get('source_movie', '')
    title = clean_movie_title(raw_title)
    
    if not title:
        print(f"No title found in {filename}")
        continue
        
    vocab_list = []
    for item in data:
        word = item.get('word', '').strip()
        trans = item.get('translation', '').strip()
        if word:
            vocab_list.append({"word": word, "translation": trans})
            
    out_json = {
        "title": title,
        "englishAnalysis": desc,
        "vocabulary": vocab_list
    }
    
    out_path = os.path.join(out_dir, f"{title}.json")
    with open(out_path, 'w', encoding='utf-8') as f:
        json.dump(out_json, f, ensure_ascii=False, indent=2)
        
    print(f"Generated {out_path} with {len(vocab_list)} words.")
