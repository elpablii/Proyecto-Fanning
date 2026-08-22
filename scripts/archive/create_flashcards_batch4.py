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
    'vocabulario_here_are_the_young_men.json': "Drama crudo situado en Irlanda. El vocabulario incluye fuerte jerga adolescente irlandesa, modismos de Dublín y expresiones de alienación, rebeldía y violencia. Requiere oído afinado para el acento irlandés.",
    'vocabulario_every_secret_thing.json': "Un thriller de misterio que presenta un vocabulario sombrío, incluyendo términos forenses, legales y policiales. El tono es tenso y el inglés estadounidense varía entre interrogatorios fríos y expresiones emocionales rotas.",
    'vocabulario_cenicienta.json': "El clásico de Disney ofrece un inglés pulcro, melódico y extremadamente poético. Las expresiones formales de la nobleza se mezclan con diálogos musicales juguetones. Ideal para aprender vocabulario de los cuentos de hadas tradicionales.",
    'vocabulario_zootopia+.json': "Serie de cortos que mantienen el ritmo de Zootopia. El vocabulario es rápido, cómico y repleto de juegos de palabras, parodiando desde realities hasta shows televisivos, lo que expone a una variedad enorme de acentos y jergas modernas.",
    'vocabulario_morgan.json': "Una cinta de ciencia ficción sobre inteligencia artificial. El vocabulario es corporativo y científico, con terminología de laboratorios, ética genética y seguridad. El diálogo es frío, calculador y muy técnico.",
    'vocabulario_sweetness_in_the_belly.json': "Este drama destaca por sus diversos acentos. El vocabulario está fuertemente marcado por temas de religión, asilo, migración y contrastes culturales, por lo que su lenguaje es muy humano, diplomático y emotivo.",
    'vocabulario_the_muppet_show.json': "Basado en los diálogos del episodio (como se refleja en 'Dialogues from The Muppet Show (with Sabrina Carpenter) to improve the vocabulary in English.pdf'), este vocabulario te expone a las ocurrencias cómicas, juegos de palabras teatrales y el ritmo acelerado típico de los Muppets mezclado con el inglés contemporáneo de Sabrina.",
    'vocabulario_minions_i.json': "Aunque los Minions tienen su propio lenguaje, los diálogos humanos presentan un vocabulario lleno de grandilocuencia, términos de conspiración mundial y descripciones pomposas típicas de villanos exagerados, ideal para captar matices paródicos.",
    'vocabulario_ginger_&_rosa.json': "Drama ambientado en el Londres de la década de 1960. El inglés destaca por el acento británico juvenil y bohemio de la época, abordando vocabulario relacionado con el pacifismo, la política, la poesía y el activismo antinuclear.",
    'vocabulario_gta_san_andreas_the_introduction.json': "El lenguaje es puro slang criminal de los años 90 en Estados Unidos. Vas a encontrarte con innumerables modismos de pandillas, insultos, y expresiones de negocios turbios de la mafia, perfecto para entender el AAVE (Inglés Vernáculo Afroamericano) y el inglés callejero.",
    'vocabulario_io.json': "Cinta de ciencia ficción post-apocalíptica. El inglés es solitario y nostálgico, con vocabulario centrado en la ecología, la geología, las transmisiones de radio y la mitología. Los diálogos son pausados y muy introspectivos."
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

# Update Home.json
home_path = os.path.join(out_dir, "Home.json")
if os.path.exists(home_path):
    with open(home_path, 'r', encoding='utf-8') as f:
        home_data = json.load(f)
    home_data["englishAnalysis"] = "De acuerdo con el documento de estudio 'Dialogues from Home to improve the vocabulary in English.pdf', el inglés aquí es muy claro y amigable. Destaca el habla del alienígena Oh, quien comete errores gramaticales intencionales que resultan en lecciones excelentes para entender la estructura del idioma al ver cómo se rompe."
    with open(home_path, 'w', encoding='utf-8') as f:
        json.dump(home_data, f, ensure_ascii=False, indent=2)
    print("Updated Home.json")
