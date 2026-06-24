import json
import os

text = """I got you hooked on them: te tengo enganchado a ellos
Snooty shopgirls: dependientas presumidas, compradoras presumidas
Big-time fashion designer: gran diseñadora de moda
You've got to look out for yourself: tienes que cuidarte
I'm scrappy: estoy desaliñado
Student housing: residencias para estudiantes
Please yourself: por favor
You don't mind I snagged the bed: no te importa que enganchara la cama
Throttle (verbo): estrangular
I had an internship at an atelier: hice unas prácticas en un taller
I had a hunch you made that: tenía la corazonada de que lo habías hecho tú
All of us turn up in our Sunday best: todos nos presentamos con nuestras mejores galas
Time to break out the big guns: hora de sacar la artillería pesada
Arse (en inglés británico): culo, trasero
Born-again christian vibes off her: vibras de cristiana renacida
Lay bet: apostar
Slashing her wrists: cortándose las venas
Starstruck: sorprendido
Take in: acoger, adoptar, aceptar
You're out on your feet: te pones de pie
Granny: abuela, abuelita
Wow (verbo): asombrar, sorprender
It rattles right through to mine: traquetea hasta la mía
Keep the plugs in: dejar/mantener los tapones puestos
When round here was a bad spot: cuando por aquí era un mal sitio
I bought it for buttons off the old owner: se lo compré por botones al antiguo dueño
Landline: teléfono fijo
Bursary: beca
Landlady: casera, patrona
Take off (en términos no relacionados con los aviones): largarse
Prayer: oración
Cease to be: deja de ser
Cloak (sustantivo): capa
Headline act: titular
A coat check girl: una chica de guardarropa
You looked up for it just then: lo buscaste justo en ese momento
Hog (verbo): acaparar
Hog (sustantivo): cerdo
Don't be a cunt about it: no seas cabrón
Untrue: falso
The hickey, very daring: el chupetón, muy atrevido
What did you get up to last night in Soho?: ¿Qué hiciste anoche en Soho?
Arnica: árnica
Knock us dead: mátanos, noquéanos
Linger (verbo): quedarse, permanecer
Fabric: tela, tejido
Drape (verbo): cubrir, tapar, envolver
Wearer (sustantivo): portador, usuario
Alluring: seductora, atractiva
A merry-go-round: un carrusel
Roundabout: rotonda, glorieta
Daft: tonterías, estupideces
Coo-ee: cucú
Wobble (sustantivo): tambaleo, bamboleo
Tune (verbo): sintonizar
Swing by: pasar por aquí
Bedsit: apartamento, departamento
A whole bunch of us: muchos de nosotros
Red-faced lush: exuberante cara roja
Clap your hands now: aplaudan ahora
Gutter: cuneta
I was gonna slap a bit of this on: iba a poner un poco de esto
Want to haunt this party with me?: ¿Quieres venir a esta fiesta conmigo?
Get these down you: bájate estos
Lovebirds: tortolitos
Mescaline: mescalina
Landmark: hito, punto de referencia
He didn't take much notice of me: no me hizo mucho caso
Hairdo: peinado
Narrow down: acotar, precisar, reducir
Settle in: asentarse, acomodarse, establecerse
Cramming for the test: preparándose para el examen
Get down in that basement: baja a ese sótano
Jukebox: gramola, tocadiscos
And lo and behold (expresión): y de repente
Pint: pinta
You were quite the ladies' man (frase no literal): eras todo un donjuán
Slab: losa
I do what I like in this manor: hago lo que me da la gana en esta mansión
Like I give a flying fuck: como si me importase un carajo
Copper (no alusivo al cobre y en inglés británico): poli, policía
A fright: un susto
All that hoo-ha last night got me going again: todo ese alboroto de anoche me ha puesto en marcha otra vez
Welfare check: control de bienestar
I'd blank them out: los dejaría en blanco
Creeping up my stairs: subiendo por mis escaleras
You just topped yourself: te acabas de superar a ti misma
Doze off: dormitar, quedarse dormido
Turn back the clock: volver atrás en el tiempo
Barren: árido, estéril
My foolish past: mi pasado insensato, mi tonto pasado
For quite some little while: desde hace muy poco tiempo"""

vocab = []
for line in text.split('\n'):
    if ':' in line:
        word, translation = line.split(':', 1)
        vocab.append({
            "word": word.strip(),
            "translation": translation.strip()
        })

data = {
    "title": "Last Night in Soho",
    "englishAnalysis": "La película presenta un contraste fascinante entre el inglés moderno de la juventud londinense y la rica jerga (slang) de los años 60s. Encontramos expresiones coloquiales fuertes y vocabulario relacionado al mundo de la moda ('atelier', 'seamstress', 'fabric') y la vida nocturna y criminal de Soho ('pub crawl', 'copper', 'lush', 'bedsit'). Es una excelente obra para acostumbrar el oído al acento británico y sus variaciones.",
    "vocabulary": vocab
}

os.makedirs('public/data/pelis', exist_ok=True)
with open('public/data/pelis/Last Night in Soho.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("JSON generado con éxito.")
