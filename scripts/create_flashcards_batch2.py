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
    'vocabulario_taylor_swift_-_the_eras_tour_film_the_final_show.json': "El inglés predominante aquí es el de las letras musicales, combinando lenguaje poético, metáforas y expresiones coloquiales. También presenta el inglés conversacional de Taylor al interactuar con el público, siendo un acento estadounidense neutro y extremadamente claro.",
    'vocabulario_marlowe.json': "Ambientada en la década de 1930, esta cinta noir ofrece un vocabulario típico del cine de detectives: términos criminales, jerga callejera de la época, sarcasmo y un lenguaje formal pero crudo. El acento estadounidense clásico de Liam Neeson añade un tono rasposo y cínico.",
    'vocabulario_work_it.json': "Una excelente opción para familiarizarse con el inglés adolescente y la jerga escolar. Está llena de modismos contemporáneos, expresiones de entusiasmo y frustración, y un vocabulario centrado en la competición, la música urbana y la superación personal.",
    'vocabulario_home.json': "Al ser animada, el inglés es muy claro, amigable y divertido. Destaca el habla peculiar del alienígena Oh, quien comete errores gramaticales intencionales muy cómicos (ideal para entender la estructura del idioma al ver cómo se rompe), contrastado con el inglés cotidiano de la protagonista.",
    'vocabulario_tall_girl_i.json': "Perfecta para practicar el inglés adolescente estadounidense. El vocabulario aborda las inseguridades, el instituto, el bullying y el primer amor. Se utiliza mucha jerga de la escuela secundaria, ideal para conversaciones cotidianas e informales.",
    'vocabulario_effie_gray.json': "Un drama de época victoriano con un inglés sumamente refinado, poético y muy formal. Incluye vocabulario avanzado relacionado con el arte, el matrimonio en la alta sociedad, la arquitectura y las presiones sociales. Recomendado para un nivel literario avanzado.",
    'vocabulario_blacklight.json': "Cargada de acción y thriller gubernamental, esta película presenta terminología sobre inteligencia, el FBI, agentes encubiertos y conspiraciones. El inglés es directo e incluye muchos modismos de las agencias de seguridad y situaciones de alta tensión.",
    'vocabulario_taylor_swift_the_1989_world_tour.json': "Un inglés predominantemente musical, enérgico y pop. El vocabulario destaca por sus ingeniosos juegos de palabras y metáforas emocionales, además de los discursos espontáneos y motivacionales de Taylor Swift dirigidos directamente a sus fans.",
    'vocabulario_the_witch.json': "Un desafío fascinante: el diálogo está escrito en un riguroso inglés moderno temprano (siglo XVII). Está lleno de arcaísmos ('thee', 'thou'), referencias bíblicas y terminología puritana. Ideal para quienes desean explorar la raíz histórica profunda del idioma.",
    'vocabulario_cars_iii.json': "El vocabulario aquí mezcla el deporte automovilístico, la superación personal y el legado. Las expresiones varían desde jerga técnica de carreras, hasta coloquialismos sureños amigables y frases de aliento típicas en la cultura deportiva.",
    'vocabulario_michael_(lista_definitiva).json': "Un recorrido por la vida de Michael Jackson, que incluye un extenso vocabulario sobre la industria musical, el escrutinio de la prensa, los procesos legales y la fama. Con mucha terminología ligada al mundo del espectáculo.",
    'vocabulario_an_american_girl_-_grace_stirs_up_success.json': "Un inglés muy familiar, optimista y educativo. Al transcurrir en una panadería y en un viaje a Francia, el vocabulario se enriquece con términos de cocina, emprendimiento y repostería, presentados de forma muy accesible para los más jóvenes.",
    'vocabulario_how_to_make_a_killing.json': "Una comedia oscura y criminal donde el inglés está repleto de dobles sentidos, sarcasmo y jerga relacionada con el engaño, la avaricia y el asesinato. El tono suele ser irónico y rápido, requiriendo atención a las sutilezas.",
    'vocabulario_the_commuter.json': "Un thriller de acción que transcurre en un tren. El inglés es rápido, cotidiano e incluye lenguaje propio de neoyorquinos de clase trabajadora, así como terminología policial, de extorsión y diálogos directos de alta intensidad emocional.",
    'vocabulario_five_nights_at_freddy\'s_ii.json': "Vocabulario de terror centrado en la supervivencia, el pánico y la seguridad. Incluye jerga laboral (turnos de noche, monitores, animatrónicos) y expresiones asociadas a la investigación de misterios perturbadores, con diálogos intensos.",
    'vocabulario_tall_girl_ii.json': "Mantiene el vocabulario adolescente de la primera entrega, pero añade términos relacionados con la presión de estar en el centro de atención, el teatro escolar y la ansiedad, con expresiones juveniles frescas y muy actualizadas.",
    'vocabulario_la_bella_durmiente.json': "Un clásico de Disney que ofrece un inglés atemporal, pausado y poético. Al incluir reyes y hadas, el vocabulario es ligeramente arcaico, majestuoso y muy formal, ideal para aprender la entonación de los cuentos de hadas tradicionales.",
    'vocabulario_the_vanishing_of_sidney_hall.json': "Un drama complejo cuyo vocabulario incluye mucha jerga literaria (el protagonista es un escritor prodigio), temas sobre la fama, la salud mental y la tragedia. El inglés oscila entre coloquialismos adolescentes y diálogos filosóficos muy profundos."
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
